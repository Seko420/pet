import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Check, ChevronDown, ChevronRight, Send, X } from 'lucide-react';
import type { AgentChatMessage, AgentRun } from '@egf/core';
import type { AiStatusInfo } from '@shared/ipc';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/labels';
import { Badge, Card, ErrorNote, SectionTitle, Spinner, type BadgeTone } from '../../components/ui';
import { useProject } from './projectContext';

const RUN_STATUS: Record<AgentRun['status'], { label: string; tone: BadgeTone }> = {
  planning: { label: 'Plane…', tone: 'accent' },
  awaiting_approval: { label: 'Wartet auf Freigabe', tone: 'warn' },
  applying: { label: 'Wendet an…', tone: 'accent' },
  completed: { label: 'Abgeschlossen', tone: 'good' },
  failed: { label: 'Fehlgeschlagen', tone: 'bad' },
  cancelled: { label: 'Verworfen', tone: 'neutral' },
};

const CHANGE_TONES: Record<string, BadgeTone> = { create: 'good', modify: 'warn', delete: 'bad' };
const CHANGE_LABELS: Record<string, string> = { create: 'neu', modify: 'ändern', delete: 'löschen' };

function RunCard({ run, onApprove, onReject, busy }: { run: AgentRun; onApprove: (id: string) => void; onReject: (id: string) => void; busy: boolean }): React.JSX.Element {
  const [openChange, setOpenChange] = useState<string | null>(null);
  const status = RUN_STATUS[run.status];

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-mist-100">{run.goal}</p>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <p className="text-xs text-mist-500">{formatDateTime(run.createdAt)}</p>

      {run.error ? <ErrorNote message={run.error} /> : null}

      {run.plan ? (
        <>
          <p className="text-sm text-mist-300">{run.plan.understanding}</p>
          {run.plan.steps.length > 0 ? (
            <ol className="list-inside list-decimal space-y-0.5 text-sm text-mist-300">
              {run.plan.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          ) : null}
          {run.plan.warnings.length > 0 ? (
            <div className="rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
              {run.plan.warnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
            </div>
          ) : null}
          {run.changes.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-mist-400">Datei-Änderungen</p>
              <ul className="space-y-1">
                {run.changes.map((change) => (
                  <li key={change.path} className="rounded-lg border border-ink-600 bg-ink-850">
                    <button
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
                      onClick={() => setOpenChange(openChange === change.path ? null : change.path)}
                    >
                      {openChange === change.path ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                      <Badge tone={CHANGE_TONES[change.kind] ?? 'neutral'}>{CHANGE_LABELS[change.kind]}</Badge>
                      <code className="truncate text-xs text-mist-200">{change.path}</code>
                    </button>
                    {openChange === change.path ? (
                      <div className="border-t border-ink-600 p-2">
                        <p className="mb-1 text-xs text-mist-400">{change.summary}</p>
                        {change.newContent !== null ? (
                          <pre className="max-h-64 overflow-auto rounded bg-ink-950 p-2 font-mono text-[11px] leading-relaxed text-mist-300">
                            {change.newContent}
                          </pre>
                        ) : (
                          <p className="text-xs italic text-bad">Datei wird gelöscht.</p>
                        )}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {run.plan.checksSuggested.length > 0 ? (
            <p className="text-xs text-mist-400">
              <span className="font-medium">Empfohlene Checks: </span>
              {run.plan.checksSuggested.join(' · ')}
            </p>
          ) : null}
        </>
      ) : null}

      {run.resultSummary ? <p className="text-sm text-mist-300">{run.resultSummary}</p> : null}

      {run.status === 'awaiting_approval' ? (
        <div className="flex gap-2 border-t border-ink-600 pt-3">
          <button
            className="btn-primary"
            disabled={busy}
            onClick={() => {
              const fileList = run.changes.map((c) => `• ${c.path} (${CHANGE_LABELS[c.kind]})`).join('\n');
              if (window.confirm(`Diese Dateien werden geändert:\n\n${fileList}\n\nÄnderungen anwenden?`)) onApprove(run.id);
            }}
          >
            <Check className="h-4 w-4" /> Änderungen anwenden
          </button>
          <button className="btn-secondary" disabled={busy} onClick={() => onReject(run.id)}>
            <X className="h-4 w-4" /> Verwerfen
          </button>
        </div>
      ) : null}
    </Card>
  );
}

export function CodeAgentView(): React.JSX.Element {
  const { project } = useProject();
  const [messages, setMessages] = useState<AgentChatMessage[] | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [ai, setAi] = useState<AiStatusInfo | null>(null);
  const [input, setInput] = useState('');
  const [goal, setGoal] = useState('');
  const [sending, setSending] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [busyRun, setBusyRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback((): void => {
    api.invoke('agent:history', { projectId: project.id }).then(setMessages).catch((err: Error) => setError(err.message));
    api.invoke('agent:listRuns', { projectId: project.id }).then(setRuns).catch(() => undefined);
    api.invoke('ai:status', undefined).then(setAi).catch(() => undefined);
  }, [project.id]);
  useEffect(load, [load]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (): Promise<void> => {
    if (!input.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const history = await api.invoke('agent:send', { projectId: project.id, message: input });
      setMessages(history);
      setInput('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const plan = async (): Promise<void> => {
    if (!goal.trim() || planning) return;
    setPlanning(true);
    setError(null);
    try {
      await api.invoke('agent:plan', { projectId: project.id, goal });
      setGoal('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPlanning(false);
    }
  };

  const approve = async (runId: string): Promise<void> => {
    setBusyRun(true);
    try {
      await api.invoke('agent:approveRun', { runId });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyRun(false);
    }
  };

  const reject = async (runId: string): Promise<void> => {
    setBusyRun(true);
    try {
      await api.invoke('agent:rejectRun', { runId });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyRun(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Code-Agent"
        subtitle="Der Agent ändert nie blind: Ziel → Plan → Freigabe → Anwendung → Zusammenfassung"
      />
      {ai && !ai.configured ? (
        <div className="rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
          Mock-Modus aktiv: Chat und Pläne sind Platzhalter ohne echte KI. Anthropic API-Key in den Einstellungen hinterlegen, um den Agenten scharf zu schalten.
        </div>
      ) : null}
      {error ? <ErrorNote message={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="flex h-[600px] flex-col">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-mist-50">
            <Bot className="h-4 w-4 text-forge-300" /> Projekt-Chat
          </h3>
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages === null ? <Spinner label="Lade Verlauf…" /> : null}
            {messages && messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-mist-500">
                Frag den Agenten etwas zu Architektur, Luau, GDScript, Balancing oder Bugs.
              </p>
            ) : null}
            {messages?.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user' ? 'bg-forge-500/20 text-mist-100' : 'bg-ink-700 text-mist-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="mt-3 flex items-end gap-2 border-t border-ink-600 pt-3">
            <textarea
              className="input max-h-32 min-h-10 flex-1 resize-none"
              rows={2}
              placeholder="Nachricht… (Enter = senden, Shift+Enter = Zeilenumbruch)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button className="btn-primary" onClick={() => void send()} disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3">
            <h3 className="font-semibold text-mist-50">Code-Änderung planen</h3>
            <textarea
              className="input min-h-20"
              placeholder='Ziel beschreiben, z.B. "Füge dem Shop eine zweite Cosmetic-Kategorie mit eigenen Preisen hinzu"'
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            <button className="btn-primary" onClick={() => void plan()} disabled={planning || !goal.trim()}>
              {planning ? 'Erstelle Plan…' : 'Plan erstellen'}
            </button>
            <p className="text-xs text-mist-500">
              Der Agent liest den Projektbaum + relevante Dateien und schlägt konkrete Datei-Änderungen vor. Nichts wird ohne deine Freigabe geschrieben; fehlgeschlagene Anwendungen werden zurückgerollt.
            </p>
          </Card>

          {runs.length === 0 ? (
            <p className="py-4 text-center text-sm text-mist-500">Noch keine Agent-Läufe.</p>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {runs.map((run) => (
                <RunCard key={run.id} run={run} onApprove={(id) => void approve(id)} onReject={(id) => void reject(id)} busy={busyRun} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
