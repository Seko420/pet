import type {
  ArtStyle,
  EffortLevel,
  ProjectStatus,
  SuggestionCategory,
  TaskPriority,
  TaskStatus,
} from '@egf/core';
import type { BadgeTone } from '../components/ui';

/** German labels for enums that don't carry labels in @egf/core. */

export const ART_STYLE_LABELS: Record<ArtStyle, string> = {
  low_poly: 'Low Poly',
  stylized_cartoon: 'Stilisierter Cartoon',
  voxel: 'Voxel',
  flat_2d: 'Flat 2D',
  pixel_art: 'Pixel Art',
  semi_realistic: 'Semi-realistisch',
  minimalist: 'Minimalistisch',
  hand_drawn: 'Handgezeichnet',
};

export const EFFORT_LABELS: Record<EffortLevel, string> = {
  tiny: 'Winzig (Tage)',
  small: 'Klein (1-2 Wochen)',
  medium: 'Mittel (~1 Monat)',
  large: 'Groß (2-3 Monate)',
  very_large: 'Sehr groß (3+ Monate)',
};

export const STATUS_TONES: Record<ProjectStatus, BadgeTone> = {
  concept: 'neutral',
  pre_production: 'neutral',
  prototype: 'accent',
  in_development: 'accent',
  testing: 'warn',
  release_prep: 'warn',
  published: 'good',
  live_ops: 'good',
  archived: 'neutral',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Offen',
  in_progress: 'In Arbeit',
  done: 'Erledigt',
  blocked: 'Blockiert',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: 'bg-bad',
  high: 'bg-warn',
  medium: 'bg-forge-400',
  low: 'bg-mist-400',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: 'Kritisch',
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

export const SUGGESTION_CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  first_minute: 'Erste Minute',
  tutorial: 'Tutorial',
  retention: 'Retention',
  monetization: 'Monetarisierung',
  cut_feature: 'Feature streichen',
  high_impact_feature: 'High-Impact-Feature',
  risk: 'Risiko',
  engagement_fairness: 'Bindung & Fairness',
};

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
