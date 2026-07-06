import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  FolderKanban,
  ListPlus,
  MessageSquarePlus,
  Pencil,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import type { GameProject } from '@egf/core';
import type { AiStatusInfo, ChatAction, ChatConversation, ChatMessage } from '@shared/ipc';
import { api } from '../lib/api';
import { Markdown } from '../components/Markdown';
import { ErrorNote, Spinner } from '../components/ui';

/**
 * Claude-style home screen: conversation list on the left, one big chat in
 * the middle. Every conversation can optionally be linked to a project so
 * the AI answers with full project context (GDD, tasks, scores).
 */

interface StreamState {
  requestId: string;
  conversationId: string;
  text: string;
}

function ConversationItem({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  conversation: ChatConversation;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}): React.JSX.Element {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(conversation.title);

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-lg bg-ink-700 px-2 py-1.5">
        <input
          className="input h-7 flex-1 px-2 py-0 text-xs"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onRename(value);
              setEditing(false);
            }
            if (e.key === 'Escape') setEditing(false);
          }}
        />
        <button
          className="rounded p-1 text-good hover:bg-ink-600"
          onClick={() => {
            onRename(value);
            setEditing(false);
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button className="rounded p-1 text-mist-400 hover:bg-ink-600" onClick={() => setEditing(false)}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group flex cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 transition-colors ${
        active ? 'bg-forge-500/15' : 'hover:bg-ink-700'
      }`}
      onClick={onSelect}
    >
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${active ? 'font-medium text-forge-200' : 'text-mist-200'}`}>
          {conversation.title}
        </p>
        {conversation.lastSnippet ? (
          <p className="truncate text-[11px] text-mist-500">{conversation.lastSnippet}</p>
        ) : null}
      </div>
      <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
        <button
          className="rounded p-1 text-mist-400 hover:bg-ink-600 hover:text-mist-100"
          title="Umbenennen"
          aria-label="Chat umbenennen"
          onClick={(e) => {
            e.stopPropagation();
            setValue(conversation.title);
            setEditing(true);
          }}
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          className="rounded p-1 text-mist-400 hover:bg-ink-600 hover:text-bad"
          title="Löschen"
          aria-label="Chat löschen"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Chat „${conversation.title}" wirklich löschen?`)) onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

const ACTION_STATUS: Record<ChatAction['status'], { label: string; className: string }> = {
  proposed: { label: 'Wartet auf deine Freigabe', className: 'text-warn' },
  executed: { label: 'Ausgeführt', className: 'text-good' },
  rejected: { label: 'Abgelehnt', className: 'text-mist-500' },
  failed: { label: 'Fehlgeschlagen', className: 'text-bad' },
};

/** Confirmation card for ONE AI-proposed app action (Claude-style tool use:
 * the AI proposes, the user clicks, the server validates and executes). */
function ActionCard({
  action,
  busy,
  onExecute,
  onReject,
}: {
  action: ChatAction;
  busy: boolean;
  onExecute: () => void;
  onReject: () => void;
}): React.JSX.Element {
  const status = ACTION_STATUS[action.status];
  return (
    <div className="mt-2 rounded-xl border border-ink-500 bg-ink-850 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm text-mist-100">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-forge-300" />
            <span className="truncate">{action.summary}</span>
          </p>
          <p className={`mt-0.5 text-[11px] ${status.className}`}>{status.label}</p>
          {action.resultNote ? <p className="mt-1 text-xs text-mist-400">{action.resultNote}</p> : null}
        </div>
        {action.status === 'proposed' ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button className="btn-primary px-2.5 py-1 text-xs" disabled={busy} onClick={onExecute}>
              <Check className="h-3.5 w-3.5" /> Ausführen
            </button>
            <button className="btn-secondary px-2.5 py-1 text-xs" disabled={busy} onClick={onReject}>
              <X className="h-3.5 w-3.5" /> Ablehnen
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  sending,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  sending: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}): React.JSX.Element {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    // Auto-grow up to a max height, like Claude's input.
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  return (
    <div className="rounded-2xl border border-ink-500 bg-ink-800 p-2 shadow-lg focus-within:border-forge-500/60">
      <textarea
        ref={ref}
        rows={1}
        autoFocus={autoFocus}
        className="max-h-52 w-full resize-none bg-transparent px-2 py-1.5 text-sm text-mist-100 placeholder:text-mist-500 focus:outline-none"
        placeholder="Schreib der KI… (Enter = senden, Shift+Enter = neue Zeile)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sending) onSend();
          }
        }}
      />
      <div className="flex items-center justify-end px-1 pt-1">
        {sending ? (
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-bad/90 text-white transition-colors hover:bg-bad"
            title="Antwort stoppen"
            aria-label="Antwort stoppen"
            onClick={onStop}
          >
            <Square className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-forge-500 text-white transition-colors hover:bg-forge-400 disabled:opacity-40"
            title="Senden"
            aria-label="Nachricht senden"
            disabled={disabled || !value.trim()}
            onClick={onSend}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ChatHome(): React.JSX.Element {
  const [conversations, setConversations] = useState<ChatConversation[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [ai, setAi] = useState<AiStatusInfo | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState<StreamState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskNote, setTaskNote] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  // Ref mirror of activeId: the SSE 'done' handler is registered once and
  // would otherwise act on a stale activeId (overwriting the wrong chat).
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const active = conversations?.find((c) => c.id === activeId) ?? null;

  const loadConversations = useCallback((): void => {
    api.invoke('chat:listConversations', undefined).then(setConversations).catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    loadConversations();
    api.invoke('projects:list', undefined).then(setProjects).catch(() => undefined);
    api.invoke('ai:status', undefined).then(setAi).catch(() => undefined);
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) {
      setMessages(null);
      return;
    }
    setMessages(null);
    api.invoke('chat:messages', { conversationId: activeId }).then(setMessages).catch((err: Error) => setError(err.message));
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Live streaming events (shared event channel with the Code-Agent; we
  // match on our own requestId).
  useEffect(() => {
    const offChunk = api.on('event:aiChunk', (event) => {
      setStreaming((prev) =>
        prev && prev.requestId === event.requestId ? { ...prev, text: prev.text + event.delta } : prev,
      );
    });
    const offDone = api.on('event:aiDone', (event) => {
      setStreaming((prev) => {
        if (!prev || prev.requestId !== event.requestId) return prev;
        setSending(false);
        if (event.error) setError(event.error);
        // Only refresh the message list if the finished chat is still the
        // one on screen - otherwise we would overwrite the wrong chat.
        if (activeIdRef.current === prev.conversationId) {
          api.invoke('chat:messages', { conversationId: prev.conversationId }).then((loaded) => {
            if (activeIdRef.current === prev.conversationId) setMessages(loaded);
          }).catch(() => undefined);
        }
        loadConversations();
        return null;
      });
    });
    return () => {
      offChunk();
      offDone();
    };
  }, [loadConversations]);

  const newChat = async (projectId: string | null = null): Promise<ChatConversation | null> => {
    try {
      const conversation = await api.invoke('chat:createConversation', { projectId });
      setConversations((prev) => [conversation, ...(prev ?? [])]);
      setActiveId(conversation.id);
      setMessages([]);
      return conversation;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };

  const send = async (): Promise<void> => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);

    let conversation = active;
    if (!conversation) {
      conversation = await newChat();
      if (!conversation) return;
    }
    setSending(true);
    setInput('');
    setMessages((prev) => [
      ...(prev ?? []),
      {
        id: `tmp-${Date.now()}`,
        conversationId: conversation.id,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
        actions: [],
      },
    ]);
    try {
      const { requestId } = await api.invoke('chat:sendStream', { conversationId: conversation.id, message: text });
      setStreaming({ requestId, conversationId: conversation.id, text: '' });
      loadConversations(); // Auto-Titel erscheint nach der ersten Nachricht.
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  };

  const stop = async (): Promise<void> => {
    if (!streaming) return;
    try {
      await api.invoke('ai:abort', { requestId: streaming.requestId });
    } catch {
      /* done-Event räumt auf */
    }
  };

  const rename = async (conversationId: string, title: string): Promise<void> => {
    try {
      const updated = await api.invoke('chat:renameConversation', { conversationId, title });
      setConversations((prev) => (prev ?? []).map((c) => (c.id === conversationId ? updated : c)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (conversationId: string): Promise<void> => {
    try {
      await api.invoke('chat:deleteConversation', { conversationId });
      setConversations((prev) => (prev ?? []).filter((c) => c.id !== conversationId));
      if (activeId === conversationId) setActiveId(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const setProject = async (projectId: string | null): Promise<void> => {
    if (!active) return;
    try {
      const updated = await api.invoke('chat:setProject', { conversationId: active.id, projectId });
      setConversations((prev) => (prev ?? []).map((c) => (c.id === active.id ? updated : c)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAction = async (messageId: string, actionIndex: number, execute: boolean): Promise<void> => {
    setActionBusy(true);
    setError(null);
    try {
      const channel = execute ? 'chat:executeAction' : 'chat:rejectAction';
      const updated = await api.invoke(channel, { messageId, actionIndex });
      setMessages(updated);
      loadConversations(); // Projekt-Verknüpfung/Reihenfolge kann sich geändert haben.
      if (execute) {
        api.invoke('projects:list', undefined).then(setProjects).catch(() => undefined);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  const saveAsTask = async (content: string): Promise<void> => {
    if (!active?.projectId) return;
    try {
      const title = (content.split('\n').find((l) => l.trim()) ?? 'KI-Vorschlag').replace(/^[#\-*\d.\s]+/, '').slice(0, 70);
      await api.invoke('tasks:create', {
        projectId: active.projectId,
        title: title || 'KI-Vorschlag',
        description: content.slice(0, 2000),
        category: 'design',
        priority: 'medium',
        milestone: 'MVP',
      });
      setTaskNote(`Aufgabe erstellt: „${title}"`);
      setTimeout(() => setTaskNote(null), 5000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const streamingHere = streaming && streaming.conversationId === activeId ? streaming : null;
  const showEmptyHero = !active || (messages !== null && messages.length === 0 && !streamingHere);

  return (
    <div className="flex h-full">
      {/* ------------------------------------------------ conversation list */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-ink-600 bg-ink-900">
        <div className="p-3">
          <button className="btn-primary w-full justify-center" onClick={() => void newChat()}>
            <MessageSquarePlus className="h-4 w-4" /> Neuer Chat
          </button>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {conversations === null ? (
            <div className="px-2 py-4">
              <Spinner label="Lade Chats…" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-mist-500">
              Noch keine Chats. Schreib einfach los – rechts im Eingabefeld.
            </p>
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
                onSelect={() => setActiveId(conversation.id)}
                onRename={(title) => void rename(conversation.id, title)}
                onDelete={() => void remove(conversation.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* --------------------------------------------------------- chat area */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* Header: project context selector */}
        <header className="flex items-center justify-between gap-3 border-b border-ink-600 px-5 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-mist-100">{active ? active.title : 'KI-Chat'}</p>
            <p className="text-[11px] text-mist-500">
              {ai ? (ai.configured ? `Verbunden: ${ai.model}` : 'Mock-Modus – Einstellungen → KI-Anbindung für echte KI') : ''}
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-xs text-mist-400">
            <FolderKanban className="h-3.5 w-3.5" />
            <select
              className="input h-8 w-52 py-0 text-xs"
              value={active?.projectId ?? ''}
              disabled={!active}
              onChange={(e) => void setProject(e.target.value || null)}
              title="Projekt-Kontext: Die KI kennt dann GDD, Aufgaben und Scores dieses Projekts"
            >
              <option value="">Ohne Projekt-Kontext</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </header>

        {error ? (
          <div className="px-5 pt-3">
            <ErrorNote message={error} />
          </div>
        ) : null}
        {taskNote ? (
          <div className="px-5 pt-3">
            <div className="rounded-lg border border-good/40 bg-good/10 px-3 py-1.5 text-xs text-good">{taskNote}</div>
          </div>
        ) : null}

        {showEmptyHero ? (
          /* Claude-style centered hero for new/empty chats */
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-forge-500/15">
                  <Sparkles className="h-6 w-6 text-forge-300" />
                </div>
                <h1 className="text-2xl font-semibold text-mist-50">Womit legen wir los?</h1>
                <p className="mt-1.5 text-sm text-mist-400">
                  Spielideen entwickeln, Luau/GDScript-Code schreiben, GDD durchdenken, Balancing rechnen – frag einfach.
                </p>
              </div>
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => void send()}
                onStop={() => void stop()}
                sending={sending}
                autoFocus
              />
              {ai && !ai.configured ? (
                <p className="text-center text-xs text-mist-500">
                  Aktuell im Mock-Modus (Platzhalter-Antworten). Echte KI kostenlos verbinden: Einstellungen → KI-Anbindung.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mx-auto w-full max-w-3xl space-y-4">
                {messages === null ? <Spinner label="Lade Verlauf…" /> : null}
                {messages?.map((message) =>
                  message.role === 'user' ? (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-forge-500/20 px-4 py-2.5 text-sm leading-relaxed text-mist-100">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div key={message.id} className="group">
                      <Markdown text={message.content} />
                      {message.actions.map((action, index) => (
                        <ActionCard
                          key={index}
                          action={action}
                          busy={actionBusy}
                          onExecute={() => void handleAction(message.id, index, true)}
                          onReject={() => void handleAction(message.id, index, false)}
                        />
                      ))}
                      {active?.projectId ? (
                        <button
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-mist-500 opacity-0 transition-opacity hover:text-forge-300 group-hover:opacity-100"
                          onClick={() => void saveAsTask(message.content)}
                          title="Erstellt eine Aufgabe auf dem Projekt-Board aus dieser Antwort"
                        >
                          <ListPlus className="h-3 w-3" /> Als Aufgabe speichern
                        </button>
                      ) : null}
                    </div>
                  ),
                )}
                {streamingHere ? (
                  <div>
                    <Markdown text={streamingHere.text} />
                    <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-forge-400 align-text-bottom" />
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="mx-auto w-full max-w-3xl">
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSend={() => void send()}
                  onStop={() => void stop()}
                  sending={sending}
                />
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
