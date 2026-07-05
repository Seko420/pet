import type {
  Audience,
  Genre,
  IdeaBrief,
  MonetizationModel,
  NewProjectInput,
  TargetPlatform,
  TaskCategory,
  TaskPriority,
} from '@egf/core';
import { AUDIENCE_LABELS, GDD_SECTION_TITLES, GENRE_LABELS, MONETIZATION_LABELS, createId, nowIso } from '@egf/core';
import type { GddSectionId } from '@egf/core';
import { AiProviderError, buildStudioChatSystem } from '@egf/ai-kit';
import type { ChatAction, ChatConversation, ChatMessage } from '../../shared/ipc';
import type { Db } from '../db/database';
import type { AiService } from './ai';
import type { ProjectsService } from './projects';
import type {
  AnalyticsService,
  ContentService,
  GddService,
  IdeasService,
  ScoresService,
  TasksService,
} from './studio';
import { buildProjectContextSnippet } from './agent';

type ChatStreamSink = (
  event:
    | { type: 'chunk'; payload: { requestId: string; projectId: string; conversationId: string; delta: string } }
    | {
        type: 'done';
        payload: {
          requestId: string;
          projectId: string;
          conversationId: string;
          ok: boolean;
          error: string | null;
        };
      },
) => void;

interface ConversationRow {
  id: string;
  project_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

/** Studio services the chat needs to EXECUTE user-confirmed AI actions. */
export interface ChatActionDeps {
  tasks: TasksService;
  gdd: GddService;
  ideas: IdeasService;
  scores: ScoresService;
  analytics: AnalyticsService;
  content: ContentService;
}

const TASK_CATEGORIES: TaskCategory[] = [
  'design', 'code', 'art', 'audio', 'ui_ux', 'monetization',
  'liveops', 'analytics', 'qa', 'publishing', 'marketing', 'infrastructure',
];
const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
const MILESTONES = ['MVP', 'Beta', 'Release'];
const PLATFORMS: TargetPlatform[] = ['roblox', 'mobile', 'both'];

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

/**
 * Extracts ```egf-action fenced blocks from an assistant reply: returns the
 * visible content (block removed) plus validated, user-confirmable actions.
 * Unknown kinds and malformed JSON are dropped silently - the reply text
 * itself always survives.
 */
export function parseChatActions(text: string): { content: string; actions: ChatAction[] } {
  const actions: ChatAction[] = [];
  const content = text
    .replace(/```egf-action\s*\n([\s\S]*?)```/g, (_match, body: string) => {
      try {
        const parsed = JSON.parse(body) as { actions?: unknown };
        const list = Array.isArray(parsed.actions) ? parsed.actions : [];
        for (const raw of list.slice(0, 8)) {
          const action = toAction(raw as Record<string, unknown>);
          if (action) actions.push(action);
        }
      } catch {
        /* malformed block -> no actions, text stays intact */
      }
      return '';
    })
    .trim();
  return { content, actions };
}

function toAction(raw: Record<string, unknown>): ChatAction | null {
  const base = { params: raw, status: 'proposed' as const, resultNote: null };
  switch (raw.kind) {
    case 'create_task': {
      const title = str(raw.title).slice(0, 70);
      if (!title) return null;
      const priority = pick(raw.priority, TASK_PRIORITIES, 'medium');
      const milestone = pick(str(raw.milestone), MILESTONES, 'MVP');
      return { ...base, kind: 'create_task', summary: `Aufgabe anlegen: „${title}" (${priority}, ${milestone})` };
    }
    case 'save_gdd_section': {
      const sectionId = str(raw.sectionId);
      if (!(sectionId in GDD_SECTION_TITLES) || str(raw.markdown).length < 20) return null;
      return {
        ...base,
        kind: 'save_gdd_section',
        summary: `GDD-Sektion überschreiben: „${GDD_SECTION_TITLES[sectionId as GddSectionId]}"`,
      };
    }
    case 'create_project': {
      const name = str(raw.name).slice(0, 60);
      if (name.length < 3) return null;
      const genre = pick(str(raw.genre) as Genre, Object.keys(GENRE_LABELS) as Genre[], 'simulator');
      const platform = pick(str(raw.platform) as TargetPlatform, PLATFORMS, 'roblox');
      return {
        ...base,
        kind: 'create_project',
        summary: `Neues Projekt anlegen: „${name}" (${GENRE_LABELS[genre]}, ${platform})`,
      };
    }
    case 'generate_ideas': {
      const count = Math.min(Math.max(Number(raw.count) || 3, 1), 5);
      return { ...base, kind: 'generate_ideas', summary: `${count} Spielideen im Idea Lab erzeugen` };
    }
    default:
      return null;
  }
}

/**
 * Global, Claude-style chat: many conversations, each optionally linked to a
 * project for grounded answers. Streaming, abort and persistence follow the
 * same pattern as the per-project Code-Agent chat.
 */
export class ChatService {
  private sink: ChatStreamSink = () => {};
  private readonly activeStreams = new Map<string, AbortController>();

  constructor(
    private readonly db: Db,
    private readonly projects: ProjectsService,
    private readonly ai: AiService,
    private readonly deps: ChatActionDeps,
  ) {}

  setSink(sink: ChatStreamSink): void {
    this.sink = sink;
  }

  abort(requestId: string): void {
    this.activeStreams.get(requestId)?.abort();
    this.activeStreams.delete(requestId);
  }

  // ---------------------------------------------------------- conversations

  private toConversation(row: ConversationRow): ChatConversation {
    const stats = this.db
      .prepare(
        'SELECT COUNT(*) AS count, (SELECT content FROM ai_chat_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1) AS last FROM ai_chat_messages WHERE conversation_id = ?',
      )
      .get(row.id, row.id) as { count: number; last: string | null };
    const lastLine = stats.last?.split('\n').find((l) => l.trim()) ?? null;
    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messageCount: stats.count,
      lastSnippet: lastLine ? lastLine.slice(0, 90) : null,
    };
  }

  private getRow(conversationId: string): ConversationRow {
    const row = this.db.prepare('SELECT * FROM ai_conversations WHERE id = ?').get(conversationId) as
      | ConversationRow
      | undefined;
    if (!row) throw new Error('Unterhaltung nicht gefunden.');
    return row;
  }

  list(): ChatConversation[] {
    const rows = this.db
      .prepare('SELECT * FROM ai_conversations ORDER BY updated_at DESC LIMIT 200')
      .all() as ConversationRow[];
    return rows.map((row) => this.toConversation(row));
  }

  create(projectId: string | null): ChatConversation {
    if (projectId) this.projects.require(projectId);
    const now = nowIso();
    const row: ConversationRow = {
      id: createId('conv'),
      project_id: projectId,
      title: 'Neuer Chat',
      created_at: now,
      updated_at: now,
    };
    this.db
      .prepare('INSERT INTO ai_conversations (id, project_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(row.id, row.project_id, row.title, row.created_at, row.updated_at);
    return this.toConversation(row);
  }

  rename(conversationId: string, title: string): ChatConversation {
    const clean = title.trim().slice(0, 80);
    if (!clean) throw new Error('Der Titel darf nicht leer sein.');
    this.getRow(conversationId);
    this.db
      .prepare('UPDATE ai_conversations SET title = ?, updated_at = ? WHERE id = ?')
      .run(clean, nowIso(), conversationId);
    return this.toConversation(this.getRow(conversationId));
  }

  setProject(conversationId: string, projectId: string | null): ChatConversation {
    if (projectId) this.projects.require(projectId);
    this.getRow(conversationId);
    this.db
      .prepare('UPDATE ai_conversations SET project_id = ?, updated_at = ? WHERE id = ?')
      .run(projectId, nowIso(), conversationId);
    return this.toConversation(this.getRow(conversationId));
  }

  delete(conversationId: string): void {
    this.db.prepare('DELETE FROM ai_conversations WHERE id = ?').run(conversationId);
  }

  // ---------------------------------------------------------------- messages

  messages(conversationId: string): ChatMessage[] {
    this.getRow(conversationId);
    const rows = this.db
      .prepare('SELECT * FROM ai_chat_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 400')
      .all(conversationId) as {
      id: string;
      conversation_id: string;
      role: string;
      content: string;
      created_at: string;
      actions: string | null;
    }[];
    return rows.map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      role: r.role as 'user' | 'assistant',
      content: r.content,
      createdAt: r.created_at,
      actions: r.actions ? (JSON.parse(r.actions) as ChatAction[]) : [],
    }));
  }

  private saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    actions: ChatAction[] = [],
  ): void {
    this.db
      .prepare('INSERT INTO ai_chat_messages (id, conversation_id, role, content, created_at, actions) VALUES (?, ?, ?, ?, ?, ?)')
      .run(createId('cmsg'), conversationId, role, content, nowIso(), actions.length > 0 ? JSON.stringify(actions) : null);
    this.db.prepare('UPDATE ai_conversations SET updated_at = ? WHERE id = ?').run(nowIso(), conversationId);
  }

  /** Sets the title from the first user message - like Claude does. */
  private autoTitle(row: ConversationRow, firstMessage: string): void {
    if (row.title !== 'Neuer Chat') return;
    const line = firstMessage.split('\n').find((l) => l.trim()) ?? firstMessage;
    const title = line.trim().replace(/[#*`]/g, '').slice(0, 48) || 'Neuer Chat';
    this.db.prepare('UPDATE ai_conversations SET title = ? WHERE id = ?').run(title, row.id);
  }

  private buildRequest(row: ConversationRow): {
    system: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
  } {
    const project = row.project_id ? this.projects.get(row.project_id) : null;
    const context = row.project_id ? buildProjectContextSnippet(this.db, this.projects, row.project_id) : '';
    return {
      system: buildStudioChatSystem(project) + context,
      messages: this.messages(row.id)
        .slice(-24)
        .map((m) => ({ role: m.role, content: m.content })),
    };
  }

  /**
   * Streamed message: persists the user message, streams deltas through the
   * sink, persists the assistant message at the end (also on abort, with the
   * partial text). Returns immediately with the requestId.
   */
  sendStream(conversationId: string, text: string): { requestId: string } {
    const row = this.getRow(conversationId);
    if (!text.trim()) throw new Error('Leere Nachricht.');
    const requestId = createId('req');
    const projectId = row.project_id ?? '';
    this.autoTitle(row, text.trim());
    this.saveMessage(conversationId, 'user', text.trim());

    const controller = new AbortController();
    this.activeStreams.set(requestId, controller);

    void (async () => {
      let full = '';
      let ok = true;
      let error: string | null = null;
      try {
        const { system, messages } = this.buildRequest(this.getRow(conversationId));
        const result = await this.ai.runStream(
          'chat_stream',
          { system, messages, maxTokens: 3000 },
          (delta) => {
            full += delta;
            this.sink({ type: 'chunk', payload: { requestId, projectId, conversationId, delta } });
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
        try {
          // Extract proposed app actions; the visible text loses the raw block.
          const parsed = parseChatActions(full);
          this.saveMessage(conversationId, 'assistant', parsed.content || full, parsed.actions);
        } catch {
          /* conversation may have been deleted mid-stream */
        }
        this.sink({ type: 'done', payload: { requestId, projectId, conversationId, ok, error } });
      }
    })();

    return { requestId };
  }

  // ----------------------------------------------------------- app actions

  private loadMessageRow(messageId: string): { conversationId: string; actions: ChatAction[] } {
    const row = this.db
      .prepare('SELECT conversation_id, actions FROM ai_chat_messages WHERE id = ?')
      .get(messageId) as { conversation_id: string; actions: string | null } | undefined;
    if (!row) throw new Error('Nachricht nicht gefunden.');
    return {
      conversationId: row.conversation_id,
      actions: row.actions ? (JSON.parse(row.actions) as ChatAction[]) : [],
    };
  }

  private saveActions(messageId: string, actions: ChatAction[]): void {
    this.db
      .prepare('UPDATE ai_chat_messages SET actions = ? WHERE id = ?')
      .run(JSON.stringify(actions), messageId);
  }

  rejectAction(messageId: string, actionIndex: number): ChatMessage[] {
    const { conversationId, actions } = this.loadMessageRow(messageId);
    const action = actions[actionIndex];
    if (!action) throw new Error('Aktion nicht gefunden.');
    if (action.status === 'proposed') {
      action.status = 'rejected';
      this.saveActions(messageId, actions);
    }
    return this.messages(conversationId);
  }

  /** Executes ONE user-confirmed action. Validation happens HERE (server-
   * side), never in the renderer; failures are recorded honestly. */
  async executeAction(messageId: string, actionIndex: number): Promise<ChatMessage[]> {
    const { conversationId, actions } = this.loadMessageRow(messageId);
    const action = actions[actionIndex];
    if (!action) throw new Error('Aktion nicht gefunden.');
    if (action.status !== 'proposed') {
      throw new Error('Diese Aktion wurde bereits behandelt.');
    }
    const conversation = this.getRow(conversationId);

    try {
      action.resultNote = await this.runAction(action, conversation);
      action.status = 'executed';
    } catch (err) {
      action.status = 'failed';
      action.resultNote = err instanceof Error ? err.message : String(err);
    }
    this.saveActions(messageId, actions);
    const icon = action.status === 'executed' ? '✅' : '⚠️';
    this.saveMessage(conversationId, 'assistant', `${icon} ${action.resultNote}`);
    return this.messages(conversationId);
  }

  private requireProject(conversation: ConversationRow): string {
    if (!conversation.project_id) {
      throw new Error('Kein Projekt verknüpft. Wähle oben rechts ein Projekt, dann kann ich dort arbeiten.');
    }
    this.projects.require(conversation.project_id);
    return conversation.project_id;
  }

  private async runAction(action: ChatAction, conversation: ConversationRow): Promise<string> {
    const p = action.params;
    switch (action.kind) {
      case 'create_task': {
        const projectId = this.requireProject(conversation);
        const task = this.deps.tasks.create({
          projectId,
          title: str(p.title).slice(0, 70),
          description: str(p.description).slice(0, 2000) || undefined,
          category: pick(p.category, TASK_CATEGORIES, 'design'),
          priority: pick(p.priority, TASK_PRIORITIES, 'medium'),
          milestone: pick(str(p.milestone), MILESTONES, 'MVP'),
        });
        return `Aufgabe „${task.title}" wurde auf dem Board angelegt (${task.priority}, ${task.milestone}).`;
      }
      case 'save_gdd_section': {
        const projectId = this.requireProject(conversation);
        const sectionId = str(p.sectionId) as GddSectionId;
        if (!(sectionId in GDD_SECTION_TITLES)) throw new Error('Unbekannte GDD-Sektion.');
        // A project may not have a GDD yet - generate it instead of failing.
        if (!this.deps.gdd.getForProject(projectId)) this.deps.gdd.generate(projectId);
        this.deps.gdd.saveSection(projectId, sectionId, str(p.markdown));
        return `GDD-Sektion „${GDD_SECTION_TITLES[sectionId]}" wurde gespeichert (neue Version im GDD-Tab).`;
      }
      case 'create_project': {
        const monetization = (Array.isArray(p.monetization) ? p.monetization : [])
          .filter((m): m is MonetizationModel => typeof m === 'string' && m in MONETIZATION_LABELS);
        const input: NewProjectInput = {
          name: str(p.name).slice(0, 60),
          platform: pick(str(p.platform) as TargetPlatform, PLATFORMS, 'roblox'),
          genre: pick(str(p.genre) as Genre, Object.keys(GENRE_LABELS) as Genre[], 'simulator'),
          audience: pick(str(p.audience) as Audience, Object.keys(AUDIENCE_LABELS) as Audience[], 'teens_13_17'),
          monetization: monetization.length > 0 ? monetization : ['game_passes', 'cosmetics'],
          artStyle: 'low_poly',
          multiplayer: p.multiplayer === true,
          qualityTarget: 'polished',
          mvpGoal: 'Kern-Loop spielbar',
          releaseGoal: 'Veröffentlichung nach vollständiger Release-Checkliste.',
          description: str(p.description).slice(0, 500),
        };
        const project = this.projects.create(input);
        // Same pipeline as the wizard: board, GDD, scores, analytics, content.
        this.deps.tasks.generateForProject(project.id);
        this.deps.gdd.generate(project.id);
        this.deps.scores.evaluateProject(project.id);
        this.deps.analytics.generatePlan(project.id);
        this.deps.content.generatePlan(project.id);
        // Link this chat to the new project so follow-up actions land there.
        this.db
          .prepare('UPDATE ai_conversations SET project_id = ?, updated_at = ? WHERE id = ?')
          .run(project.id, nowIso(), conversation.id);
        return `Projekt „${project.name}" wurde komplett angelegt (Aufgabenplan, GDD, Scores, Analytics, Content) und mit diesem Chat verknüpft. Du findest es im Dashboard.`;
      }
      case 'generate_ideas': {
        const genres = (Array.isArray(p.genres) ? p.genres : [])
          .filter((g): g is Genre => typeof g === 'string' && g in GENRE_LABELS);
        const brief: IdeaBrief = {
          platform: pick(str(p.platform) as TargetPlatform, PLATFORMS, 'roblox'),
          genres,
          audience: 'teens_13_17',
          monetizationFocus: [],
          maxEffort: 'small',
          multiplayer: 'any',
          themeHints: str(p.themeHints) || undefined,
          count: Math.min(Math.max(Number(p.count) || 3, 1), 5),
          useAi: false, // offline engine: works in every mode, deterministic
        };
        const ideas = await this.deps.ideas.generate(brief);
        const titles = ideas.map((i) => `„${i.title}"`).join(', ');
        return `${ideas.length} Spielideen im Idea Lab erzeugt: ${titles}. Öffne das Idea Lab, um sie anzusehen.`;
      }
      default:
        throw new Error('Unbekannte Aktion.');
    }
  }
}
