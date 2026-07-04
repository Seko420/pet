import type { IsoDateTime } from './common';

/**
 * Playtest feedback system: capture sessions, log findings, convert the
 * important ones into tasks - closing the iterate-like-a-studio loop.
 */

export type PlaytestFindingCategory =
  | 'bug'
  | 'confusion'
  | 'frustration'
  | 'boredom'
  | 'delight'
  | 'suggestion';

export const PLAYTEST_CATEGORY_LABELS: Record<PlaytestFindingCategory, string> = {
  bug: 'Bug',
  confusion: 'Verwirrung',
  frustration: 'Frustration',
  boredom: 'Langeweile',
  delight: 'Begeisterung',
  suggestion: 'Vorschlag',
};

export type PlaytestSeverity = 'low' | 'medium' | 'high';

export interface PlaytestFinding {
  id: string;
  category: PlaytestFindingCategory;
  severity: PlaytestSeverity;
  description: string;
  /** Where in the game it happened (level, screen, minute). */
  location: string;
  /** Task created from this finding, if converted. */
  convertedTaskId: string | null;
}

export interface PlaytestSession {
  id: string;
  projectId: string;
  title: string;
  /** Free-form date string the user enters (kept simple on purpose). */
  playedAt: string;
  testerCount: number;
  buildLabel: string;
  notes: string;
  findings: PlaytestFinding[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}
