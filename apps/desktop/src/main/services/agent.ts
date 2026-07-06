import type { AgentChatMessage, AgentFileChange, AgentPlan, AgentRun } from '@egf/core';
import { createId, nowIso } from '@egf/core';
import { AiProviderError, buildAgentChatSystem, buildAgentPlanPrompt } from '@egf/ai-kit';
import type { FileNode } from '../../shared/ipc';
import type { Db } from '../db/database';
import type { AiService } from './ai';
import type { FilesService } from './files';
import type { ProjectsService } from './projects';

type AgentStreamSink = (
  event:
    | { type: 'chunk'; payload: { requestId: string; projectId: string; delta: string } }
    | { type: 'done'; payload: { requestId: string; projectId: string; ok: boolean; error: string | null } },
) => void;

/**
 * Compact project context (GDD overview, board state, scores) injected into
 * chat system prompts so answers are grounded in THIS project. Shared by the
 * per-project Code-Agent chat and the global studio chat. Best-effort: never
 * throws, size-bounded to keep token usage predictable.
 */
export function buildProjectContextSnippet(db: Db, projects: ProjectsService, projectId: string): string {
  const parts: string[] = [];
  try {
    const gddRow = db.prepare('SELECT data FROM gdds WHERE project_id = ?').get(projectId) as
      | { data: string }
      | undefined;
    if (gddRow) {
      const gdd = JSON.parse(gddRow.data) as { sections: { id: string; markdown: string }[] };
      const overview = gdd.sections.find((s) => s.id === 'overview');
      if (overview) parts.push(`GDD-ÜBERBLICK:\n${overview.markdown.slice(0, 700)}`);
    }
    const taskRows = db
      .prepare("SELECT data FROM tasks WHERE project_id = ? AND status != 'done' ORDER BY sort_order LIMIT 6")
      .all(projectId) as { data: string }[];
    const counts = db
      .prepare("SELECT SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS done, COUNT(*) AS total FROM tasks WHERE project_id = ?")
      .get(projectId) as { done: number | null; total: number };
    if (counts.total > 0) {
      const titles = taskRows.map((r) => `- ${(JSON.parse(r.data) as { title: string }).title}`);
      parts.push(`AUFGABEN (${counts.done ?? 0}/${counts.total} erledigt), nächste offene:\n${titles.join('\n')}`);
    }
    const project = projects.get(projectId);
    if (project?.scores) {
      parts.push(
        `SCORES: Gesamt ${project.scores.overall}/100, Fun ${project.scores.fun.value}, Retention ${project.scores.retention.value}, Monetarisierung ${project.scores.monetization.value}`,
      );
    }
  } catch {
    /* context is best-effort - never block the chat */
  }
  return parts.length > 0 ? `\n\nAKTUELLER PROJEKT-KONTEXT:\n${parts.join('\n\n')}` : '';
}

/**
 * Code Agent backend. The loop is fixed and non-negotiable:
 * goal -> plan (AI) -> awaiting_approval -> (user approves) -> apply with
 * undo snapshots -> summarize. A failed apply rolls back everything.
 * Chat supports streaming (deltas via sink) with per-request abort.
 */
export class AgentService {
  private sink: AgentStreamSink = () => {};
  private readonly activeStreams = new Map<string, AbortController>();

  constructor(
    private readonly db: Db,
    private readonly projects: ProjectsService,
    private readonly files: FilesService,
    private readonly ai: AiService,
  ) {}

  setSink(sink: AgentStreamSink): void {
    this.sink = sink;
  }

  abort(requestId: string): void {
    this.activeStreams.get(requestId)?.abort();
    this.activeStreams.delete(requestId);
  }

  // ------------------------------------------------------------------ chat

  history(projectId: string): AgentChatMessage[] {
    const rows = this.db
      .prepare('SELECT data FROM agent_messages WHERE project_id = ? ORDER BY created_at ASC, rowid ASC LIMIT 200')
      .all(projectId) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as AgentChatMessage);
  }

  private saveMessage(message: AgentChatMessage): void {
    this.db
      .prepare('INSERT INTO agent_messages (id, project_id, created_at, data) VALUES (?, ?, ?, ?)')
      .run(message.id, message.projectId, message.createdAt, JSON.stringify(message));
  }

  private buildChatRequest(projectId: string): { system: string; messages: { role: 'user' | 'assistant'; content: string }[] } {
    const project = this.projects.require(projectId);
    const historyMessages = this.history(projectId)
      .slice(-20)
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    return {
      system: buildAgentChatSystem(project) + buildProjectContextSnippet(this.db, this.projects, projectId),
      messages: historyMessages,
    };
  }

  async send(projectId: string, text: string): Promise<AgentChatMessage[]> {
    this.projects.require(projectId);
    if (!text.trim()) throw new Error('Leere Nachricht.');
    this.saveMessage({
      id: createId('msg'),
      projectId,
      role: 'user',
      content: text.trim(),
      runId: null,
      createdAt: nowIso(),
    });

    let reply: string;
    try {
      const { system, messages } = this.buildChatRequest(projectId);
      const result = await this.ai.run('chat', { system, messages, maxTokens: 2000 });
      reply = result.text;
    } catch (err) {
      // Honest degradation: the error becomes the assistant message.
      reply =
        err instanceof AiProviderError
          ? `KI-Anfrage fehlgeschlagen: ${err.message}`
          : 'KI-Anfrage fehlgeschlagen (unbekannter Fehler). Details im App-Log.';
    }
    this.saveMessage({
      id: createId('msg'),
      projectId,
      role: 'assistant',
      content: reply,
      runId: null,
      createdAt: nowIso(),
    });
    return this.history(projectId);
  }

  /**
   * Streamed chat: persists the user message, streams deltas through the
   * sink, persists the assistant message at the end (also on abort, with
   * the partial text). Returns immediately with the requestId.
   */
  sendStream(projectId: string, text: string): { requestId: string } {
    this.projects.require(projectId);
    if (!text.trim()) throw new Error('Leere Nachricht.');
    const requestId = createId('req');
    this.saveMessage({
      id: createId('msg'),
      projectId,
      role: 'user',
      content: text.trim(),
      runId: null,
      createdAt: nowIso(),
    });

    const controller = new AbortController();
    this.activeStreams.set(requestId, controller);

    void (async () => {
      let full = '';
      let ok = true;
      let error: string | null = null;
      try {
        const { system, messages } = this.buildChatRequest(projectId);
        const result = await this.ai.runStream(
          'chat_stream',
          { system, messages, maxTokens: 2000 },
          (delta) => {
            full += delta;
            this.sink({ type: 'chunk', payload: { requestId, projectId, delta } });
          },
          controller.signal,
        );
        full = result.text || full;
      } catch (err) {
        if (err instanceof AiProviderError && err.kind === 'aborted') {
          full = full ? `${full}\n\n[Vom Nutzer gestoppt]` : '[Vom Nutzer gestoppt]';
        } else {
          ok = false;
          error = err instanceof Error ? err.message : String(err);
          full = full || `KI-Anfrage fehlgeschlagen: ${error}`;
        }
      } finally {
        this.activeStreams.delete(requestId);
        this.saveMessage({
          id: createId('msg'),
          projectId,
          role: 'assistant',
          content: full,
          runId: null,
          createdAt: nowIso(),
        });
        this.sink({ type: 'done', payload: { requestId, projectId, ok, error } });
      }
    })();

    return { requestId };
  }

  // ------------------------------------------------------------------ runs

  listRuns(projectId: string): AgentRun[] {
    const rows = this.db
      .prepare('SELECT data FROM agent_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 25')
      .all(projectId) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as AgentRun);
  }

  private getRun(runId: string): AgentRun {
    const row = this.db.prepare('SELECT data FROM agent_runs WHERE id = ?').get(runId) as { data: string } | undefined;
    if (!row) throw new Error('Agent-Lauf nicht gefunden.');
    return JSON.parse(row.data) as AgentRun;
  }

  private persistRun(run: AgentRun, isNew: boolean): void {
    run.updatedAt = nowIso();
    if (isNew) {
      this.db
        .prepare('INSERT INTO agent_runs (id, project_id, status, created_at, data) VALUES (?, ?, ?, ?, ?)')
        .run(run.id, run.projectId, run.status, run.createdAt, JSON.stringify(run));
    } else {
      this.db.prepare('UPDATE agent_runs SET status = ?, data = ? WHERE id = ?').run(run.status, JSON.stringify(run), run.id);
    }
  }

  private buildFileTreeText(node: FileNode | null): string {
    if (!node) return '(Projektordner leer oder nicht vorhanden)';
    const lines: string[] = [];
    const walk = (n: FileNode, indent: string): void => {
      for (const child of n.children ?? []) {
        lines.push(`${indent}${child.kind === 'directory' ? child.name + '/' : child.name}`);
        if (child.kind === 'directory') walk(child, indent + '  ');
        if (lines.length > 300) return;
      }
    };
    walk(node, '');
    return lines.slice(0, 300).join('\n');
  }

  private collectExcerpts(projectId: string, tree: FileNode | null, goal: string): { path: string; content: string }[] {
    if (!tree) return [];
    const allFiles: string[] = [];
    const walk = (n: FileNode): void => {
      for (const child of n.children ?? []) {
        if (child.kind === 'file') allFiles.push(child.path);
        else walk(child);
      }
    };
    walk(tree);
    const goalWords = goal.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const scored = allFiles
      .filter((p) => /\.(luau|lua|gd|json|md|ts|tscn)$/.test(p))
      .map((p) => ({
        path: p,
        score:
          goalWords.filter((w) => p.toLowerCase().includes(w)).length * 10 +
          (/(main|config|readme)/i.test(p) ? 3 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    const excerpts: { path: string; content: string }[] = [];
    for (const { path } of scored) {
      try {
        const file = this.files.read(projectId, path);
        if (!file.readOnly) excerpts.push({ path, content: file.content.slice(0, 6000) });
      } catch {
        /* skip unreadable files */
      }
    }
    return excerpts;
  }

  async plan(projectId: string, goal: string): Promise<AgentRun> {
    this.projects.require(projectId);
    if (!goal.trim()) throw new Error('Bitte ein Ziel für den Agenten angeben.');
    const now = nowIso();
    const run: AgentRun = {
      id: createId('arun'),
      projectId,
      goal: goal.trim(),
      status: 'planning',
      plan: null,
      changes: [],
      resultSummary: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    this.persistRun(run, true);

    let tree: FileNode | null = null;
    try {
      tree = this.files.tree(projectId);
    } catch {
      tree = null;
    }
    const provider = this.ai.getProvider();
    const providerStatus = await provider.status();
    const { system, user } = buildAgentPlanPrompt(
      goal,
      this.buildFileTreeText(tree),
      this.collectExcerpts(projectId, tree, goal),
    );

    try {
      const result = await this.ai.run('agent_plan', {
        system,
        messages: [{ role: 'user', content: user }],
        jsonMode: true,
        maxTokens: 8000,
      });
      const parsed = this.parsePlanJson(result.text);
      run.plan = parsed.plan;
      run.changes = parsed.changes;
      run.status = 'awaiting_approval';
      if (!providerStatus.configured) {
        run.plan.warnings.push(
          'Mock-Modus: Dieser Plan ist ein Platzhalter ohne echte Code-Analyse. Anthropic API-Key in den Einstellungen hinterlegen für echte Pläne.',
        );
      }
    } catch (err) {
      run.status = 'failed';
      run.error =
        err instanceof AiProviderError
          ? err.message
          : `Plan konnte nicht erstellt werden: ${err instanceof Error ? err.message : String(err)}`;
    }
    this.persistRun(run, false);
    return run;
  }

  private parsePlanJson(text: string): { plan: AgentPlan; changes: AgentFileChange[] } {
    // Robust extraction: take the first balanced top-level JSON object.
    const start = text.indexOf('{');
    if (start < 0) throw new Error('KI-Antwort enthielt kein JSON-Objekt.');
    let parsed: unknown = null;
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) {
          try {
            parsed = JSON.parse(text.slice(start, i + 1));
          } catch {
            parsed = null;
          }
          break;
        }
      }
    }
    if (parsed === null || typeof parsed !== 'object') {
      throw new Error('KI-Antwort war kein gültiges JSON - bitte erneut versuchen.');
    }
    const raw = parsed as Record<string, unknown>;
    const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
    const plan: AgentPlan = {
      goal: '',
      understanding: typeof raw.understanding === 'string' ? raw.understanding : 'Kein Verständnis-Text geliefert.',
      steps: strArray(raw.steps),
      affectedFiles: Array.isArray(raw.affectedFiles)
        ? (raw.affectedFiles as Record<string, unknown>[])
            .filter((f) => typeof f.path === 'string')
            .map((f) => ({
              path: f.path as string,
              kind: (['create', 'modify', 'delete'].includes(f.kind as string) ? f.kind : 'modify') as 'create' | 'modify' | 'delete',
              reason: typeof f.reason === 'string' ? f.reason : '',
            }))
        : [],
      checksSuggested: strArray(raw.checksSuggested),
      warnings: strArray(raw.warnings),
    };
    const changes: AgentFileChange[] = Array.isArray(raw.changes)
      ? (raw.changes as Record<string, unknown>[])
          .filter((c) => typeof c.path === 'string' && ['create', 'modify', 'delete'].includes(c.kind as string))
          .map((c) => ({
            path: c.path as string,
            kind: c.kind as 'create' | 'modify' | 'delete',
            summary: typeof c.summary === 'string' ? c.summary : '',
            newContent: typeof c.newContent === 'string' ? c.newContent : null,
            previousContent: null,
          }))
      : [];
    return { plan, changes };
  }

  approveRun(runId: string): AgentRun {
    const run = this.getRun(runId);
    if (run.status !== 'awaiting_approval') {
      throw new Error(`Dieser Lauf wartet nicht auf Freigabe (Status: ${run.status}).`);
    }
    run.status = 'applying';
    this.persistRun(run, false);

    const applied: AgentFileChange[] = [];
    try {
      for (const change of run.changes) {
        // Snapshot for undo/rollback.
        try {
          const existing = this.files.read(run.projectId, change.path);
          change.previousContent = existing.readOnly ? null : existing.content;
        } catch {
          change.previousContent = null;
        }
        if (change.kind === 'delete') {
          this.files.deleteFile(run.projectId, change.path);
        } else {
          if (change.newContent === null) {
            throw new Error(`Änderung für ${change.path} enthält keinen Inhalt.`);
          }
          this.files.write(run.projectId, change.path, change.newContent);
        }
        applied.push(change);
      }
      run.status = 'completed';
      run.resultSummary = `${applied.length} Datei-Änderung(en) angewendet. Empfohlene Checks: ${run.plan?.checksSuggested.join('; ') || 'manuell testen'}.`;
    } catch (err) {
      // Roll back everything already applied.
      for (const change of applied.reverse()) {
        try {
          if (change.previousContent !== null) {
            this.files.write(run.projectId, change.path, change.previousContent);
          } else if (change.kind === 'create') {
            this.files.deleteFile(run.projectId, change.path);
          }
        } catch {
          /* best effort rollback */
        }
      }
      run.status = 'failed';
      run.error = `Anwenden fehlgeschlagen, Änderungen zurückgerollt: ${err instanceof Error ? err.message : String(err)}`;
    }
    this.persistRun(run, false);
    return run;
  }

  rejectRun(runId: string): AgentRun {
    const run = this.getRun(runId);
    if (run.status !== 'awaiting_approval') {
      throw new Error(`Dieser Lauf wartet nicht auf Freigabe (Status: ${run.status}).`);
    }
    run.status = 'cancelled';
    run.resultSummary = 'Vom Nutzer verworfen - keine Datei wurde geändert.';
    this.persistRun(run, false);
    return run;
  }
}
