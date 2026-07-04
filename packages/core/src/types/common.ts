/**
 * Shared enums and small value types used across the whole product.
 * These are the single source of truth - renderer, main process and all
 * generator packages import from here.
 */

export type TargetPlatform = 'roblox' | 'mobile' | 'both';

export type ProjectStatus =
  | 'concept'
  | 'pre_production'
  | 'prototype'
  | 'in_development'
  | 'testing'
  | 'release_prep'
  | 'published'
  | 'live_ops'
  | 'archived';

export type QualityTarget = 'prototype' | 'polished' | 'premium';

export type Genre =
  | 'simulator'
  | 'tycoon'
  | 'obby'
  | 'rpg_lite'
  | 'survival'
  | 'roguelite'
  | 'idle'
  | 'hypercasual'
  | 'hybridcasual'
  | 'puzzle'
  | 'tower_defense'
  | 'battle_arena'
  | 'racing'
  | 'horror'
  | 'social_hangout'
  | 'sandbox'
  | 'card_battler'
  | 'merge'
  | 'runner'
  | 'sports';

export type Audience =
  | 'kids_8_12'
  | 'teens_13_17'
  | 'young_adults_18_24'
  | 'adults_25_plus'
  | 'family'
  | 'core_gamers'
  | 'casual_broad';

export type MonetizationModel =
  | 'game_passes'
  | 'developer_products'
  | 'premium_payouts'
  | 'cosmetics'
  | 'battle_pass'
  | 'rewarded_ads'
  | 'interstitial_ads'
  | 'iap_consumables'
  | 'iap_non_consumables'
  | 'subscription'
  | 'paid_app';

export type ArtStyle =
  | 'low_poly'
  | 'stylized_cartoon'
  | 'voxel'
  | 'flat_2d'
  | 'pixel_art'
  | 'semi_realistic'
  | 'minimalist'
  | 'hand_drawn';

export type EffortLevel = 'tiny' | 'small' | 'medium' | 'large' | 'very_large';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** ISO-8601 timestamp string (UTC). */
export type IsoDateTime = string;

export interface LabeledScore {
  /** 0..100 */
  value: number;
  /** One-sentence justification, shown in the UI next to the score. */
  reason: string;
}

export const GENRE_LABELS: Record<Genre, string> = {
  simulator: 'Simulator',
  tycoon: 'Tycoon',
  obby: 'Obby / Parkour',
  rpg_lite: 'RPG-lite',
  survival: 'Survival',
  roguelite: 'Roguelite',
  idle: 'Idle / Incremental',
  hypercasual: 'Hypercasual',
  hybridcasual: 'Hybridcasual',
  puzzle: 'Puzzle',
  tower_defense: 'Tower Defense',
  battle_arena: 'Battle Arena / PvP',
  racing: 'Racing',
  horror: 'Horror',
  social_hangout: 'Social Hangout',
  sandbox: 'Sandbox / Building',
  card_battler: 'Card Battler',
  merge: 'Merge',
  runner: 'Runner',
  sports: 'Sports',
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  kids_8_12: 'Kinder (8-12)',
  teens_13_17: 'Teens (13-17)',
  young_adults_18_24: 'Junge Erwachsene (18-24)',
  adults_25_plus: 'Erwachsene (25+)',
  family: 'Familie',
  core_gamers: 'Core Gamer',
  casual_broad: 'Casual (breit)',
};

export const MONETIZATION_LABELS: Record<MonetizationModel, string> = {
  game_passes: 'Roblox Game Passes',
  developer_products: 'Roblox Developer Products',
  premium_payouts: 'Roblox Premium Payouts',
  cosmetics: 'Cosmetics / Skins',
  battle_pass: 'Battle Pass',
  rewarded_ads: 'Rewarded Ads',
  interstitial_ads: 'Interstitial Ads',
  iap_consumables: 'IAP (Verbrauchsgueter)',
  iap_non_consumables: 'IAP (Dauerhaft)',
  subscription: 'Abo',
  paid_app: 'Bezahl-App',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  concept: 'Konzept',
  pre_production: 'Pre-Production',
  prototype: 'Prototyp',
  in_development: 'In Entwicklung',
  testing: 'Testing',
  release_prep: 'Release-Vorbereitung',
  published: 'Veroeffentlicht',
  live_ops: 'LiveOps',
  archived: 'Archiviert',
};
