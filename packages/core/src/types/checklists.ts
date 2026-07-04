import type { TargetPlatform } from './common';

export type ChecklistKind =
  | 'release'
  | 'app_store'
  | 'privacy'
  | 'roblox_publishing'
  | 'monetization_ethics';

export interface ChecklistItem {
  id: string;
  title: string;
  detail: string;
  /** Items marked required block the release checklist from passing. */
  required: boolean;
  /** Link to official docs where applicable. */
  docsUrl?: string;
}

export interface Checklist {
  kind: ChecklistKind;
  title: string;
  description: string;
  platforms: TargetPlatform[];
  items: ChecklistItem[];
}

export const CHECKLIST_KIND_LABELS: Record<ChecklistKind, string> = {
  release: 'Release-Checkliste',
  app_store: 'App-Store-Checkliste',
  privacy: 'Datenschutz-Checkliste',
  roblox_publishing: 'Roblox-Publishing-Checkliste',
  monetization_ethics: 'Faire Monetarisierung',
};
