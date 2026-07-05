import { createId, nowIso } from '@egf/core';
import { AiProviderError, buildStudioChatSystem } from '@egf/ai-kit';
import type { ChatConversation, ChatMessage } from '../../shared/ipc';
import type { Db } from '../db/database';
import type { AiService } from './ai';
import type { ProjectsService } from './projects';
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
      .all(conversationId) as { id: string; conversation_id: string; role: string; content: string; created_at: string }[];
    return rows.map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      role: r.role as 'user' | 'assistant',
      content: r.content,
      createdAt: r.created_at,
    }));
  }

  private saveMessage(conversationId: string, role: 'user' | 'assistant', content: string): void {
    this.db
      .prepare('INSERT INTO ai_chat_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(createId('cmsg'), conversationId, role, content, nowIso());
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
          this.saveMessage(conversationId, 'assistant', full);
        } catch {
          /* conversation may have been deleted mid-stream */
        }
        this.sink({ type: 'done', payload: { requestId, projectId, conversationId, ok, error } });
      }
    })();

    return { requestId };
  }
}
