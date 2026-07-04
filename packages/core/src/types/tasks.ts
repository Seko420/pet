import type { IsoDateTime } from './common';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export type TaskCategory =
  | 'design'
  | 'code'
  | 'art'
  | 'audio'
  | 'ui_ux'
  | 'monetization'
  | 'liveops'
  | 'analytics'
  | 'qa'
  | 'publishing'
  | 'marketing'
  | 'infrastructure';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  /** Rough estimate in hours; null = not estimated. */
  estimateHours: number | null;
  /** Milestone grouping, e.g. "MVP", "Beta", "Release". */
  milestone: string;
  sortOrder: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  design: 'Game Design',
  code: 'Code',
  art: 'Art / Assets',
  audio: 'Audio',
  ui_ux: 'UI / UX',
  monetization: 'Monetarisierung',
  liveops: 'LiveOps',
  analytics: 'Analytics',
  qa: 'QA / Tests',
  publishing: 'Publishing',
  marketing: 'Marketing',
  infrastructure: 'Infrastruktur',
};
