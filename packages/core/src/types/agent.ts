import type { IsoDateTime } from './common';

/**
 * The Code Agent never edits blindly. Every run follows:
 * understand goal -> plan -> list affected files -> (user approves) ->
 * apply changes -> suggest checks -> summarize.
 */
export type AgentRunStatus =
  | 'planning'
  | 'awaiting_approval'
  | 'applying'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AgentFileChange {
  path: string;
  kind: 'create' | 'modify' | 'delete';
  /** Short human explanation of what changes in this file and why. */
  summary: string;
  /** Full new content for create/modify; null for delete. */
  newContent: string | null;
  /** Previous content snapshot for modify/delete (enables undo). */
  previousContent: string | null;
}

export interface AgentPlan {
  goal: string;
  understanding: string;
  steps: string[];
  affectedFiles: { path: string; kind: 'create' | 'modify' | 'delete'; reason: string }[];
  checksSuggested: string[];
  warnings: string[];
}

export interface AgentRun {
  id: string;
  projectId: string;
  goal: string;
  status: AgentRunStatus;
  plan: AgentPlan | null;
  changes: AgentFileChange[];
  resultSummary: string | null;
  error: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface AgentChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** Attached run when the message triggered an agent run. */
  runId: string | null;
  createdAt: IsoDateTime;
}
