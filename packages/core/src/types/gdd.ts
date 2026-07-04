import type { IsoDateTime } from './common';

/**
 * A Game Design Document is stored as an ordered list of sections.
 * Each section is markdown; the full document can be exported as one file.
 */
export interface GddSection {
  id: GddSectionId;
  title: string;
  markdown: string;
}

export type GddSectionId =
  | 'overview'
  | 'story_setting'
  | 'core_loop'
  | 'progression'
  | 'level_design'
  | 'economy'
  | 'items'
  | 'enemies'
  | 'quests'
  | 'multiplayer'
  | 'ui_ux'
  | 'monetization'
  | 'liveops'
  | 'events'
  | 'analytics'
  | 'balancing'
  | 'roblox_implementation'
  | 'mobile_implementation'
  | 'technical_architecture'
  | 'mvp_scope'
  | 'full_release_scope';

export const GDD_SECTION_TITLES: Record<GddSectionId, string> = {
  overview: 'Spieluebersicht',
  story_setting: 'Story & Setting',
  core_loop: 'Core Gameplay Loop',
  progression: 'Progression',
  level_design: 'Leveldesign',
  economy: 'Economy',
  items: 'Items',
  enemies: 'Gegner & Bosse',
  quests: 'Quests',
  multiplayer: 'Multiplayer-Konzept',
  ui_ux: 'UI / UX',
  monetization: 'Monetarisierung',
  liveops: 'LiveOps',
  events: 'Events',
  analytics: 'Analytics',
  balancing: 'Balancing',
  roblox_implementation: 'Roblox-Umsetzung',
  mobile_implementation: 'Mobile-Umsetzung',
  technical_architecture: 'Technische Architektur',
  mvp_scope: 'MVP-Scope',
  full_release_scope: 'Full-Release-Scope',
};

export interface GddDocument {
  id: string;
  projectId: string;
  version: number;
  sections: GddSection[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}
