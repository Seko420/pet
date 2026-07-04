import type { TargetPlatform } from './common';

export type AnalyticsEventCategory =
  | 'onboarding'
  | 'progression'
  | 'economy'
  | 'monetization'
  | 'engagement'
  | 'churn_signal';

export interface AnalyticsEventSpec {
  /** snake_case event name, e.g. "tutorial_completed". */
  name: string;
  category: AnalyticsEventCategory;
  description: string;
  /** Parameters to log with the event: name -> description. */
  parameters: Record<string, string>;
  /** Why this event matters / which decision it informs. */
  rationale: string;
  platforms: TargetPlatform[];
}

export interface LiveOpsCalendarEntry {
  /** Week offset from launch, 0-based. */
  week: number;
  title: string;
  kind: 'event' | 'content_drop' | 'sale' | 'season_start' | 'season_end' | 'ab_test';
  description: string;
}

export interface AbTestIdea {
  name: string;
  hypothesis: string;
  variantA: string;
  variantB: string;
  primaryMetric: string;
}

export interface AnalyticsPlan {
  projectId: string;
  events: AnalyticsEventSpec[];
  liveOpsCalendar: LiveOpsCalendarEntry[];
  abTests: AbTestIdea[];
  balancingNotes: string[];
}
