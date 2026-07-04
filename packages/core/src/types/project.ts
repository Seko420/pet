import type {
  ArtStyle,
  Audience,
  Genre,
  IsoDateTime,
  MonetizationModel,
  ProjectStatus,
  QualityTarget,
  TargetPlatform,
} from './common';
import type { QualityScores } from './scores';

/** Roblox connection & publishing configuration for a project. */
export interface RobloxProjectConfig {
  /** Roblox Universe ID (aka Experience ID). */
  universeId: string | null;
  /** Roblox Place ID of the start place. */
  placeId: string | null;
  /**
   * Reference to the encrypted Open Cloud API key in the secrets store.
   * The key itself NEVER appears in project data, files or logs.
   */
  apiKeySecretId: string | null;
  /** Absolute path of the generated Rojo project on disk, if scaffolded. */
  rojoProjectPath: string | null;
  /** Last validation result of the local Rojo/Luau project. */
  lastValidation: {
    at: IsoDateTime;
    ok: boolean;
    issues: string[];
  } | null;
  publishHistory: RobloxPublishRecord[];
}

export interface RobloxPublishRecord {
  at: IsoDateTime;
  placeId: string;
  versionNumber: number | null;
  mode: 'dry_run' | 'published';
  ok: boolean;
  message: string;
}

export type MobileEngine = 'godot';

export interface MobilePerformanceBudget {
  targetFps: number;
  maxMemoryMb: number;
  maxApkSizeMb: number;
  maxColdStartSeconds: number;
  maxDrawCalls: number;
}

/** Mobile (Android-first) configuration for a project. */
export interface MobileProjectConfig {
  engine: MobileEngine;
  /** Reverse-domain package id, e.g. com.studio.mygame */
  packageId: string | null;
  orientation: 'portrait' | 'landscape' | 'sensor';
  minAndroidSdk: number;
  performanceBudget: MobilePerformanceBudget;
  /** Absolute path of the generated Godot project on disk, if scaffolded. */
  godotProjectPath: string | null;
  /** Checklist item ids the user has ticked (store + privacy checklists). */
  completedChecklistItems: string[];
}

export interface GameProject {
  id: string;
  name: string;
  /** Filesystem-safe short name, used for generated folders. */
  slug: string;
  platform: TargetPlatform;
  genre: Genre;
  audience: Audience;
  status: ProjectStatus;
  monetization: MonetizationModel[];
  artStyle: ArtStyle;
  multiplayer: boolean;
  qualityTarget: QualityTarget;
  mvpGoal: string;
  releaseGoal: string;
  description: string;
  /** Root folder of the generated game workspace on disk (null until scaffolded). */
  workspacePath: string | null;
  /** Idea this project was promoted from, if any. */
  ideaId: string | null;
  scores: QualityScores | null;
  roblox: RobloxProjectConfig | null;
  mobile: MobileProjectConfig | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** Input collected by the "Neues Projekt" wizard. */
export interface NewProjectInput {
  name: string;
  platform: TargetPlatform;
  genre: Genre;
  audience: Audience;
  monetization: MonetizationModel[];
  artStyle: ArtStyle;
  multiplayer: boolean;
  qualityTarget: QualityTarget;
  mvpGoal: string;
  releaseGoal: string;
  description?: string;
  /** Promote an existing idea into this project. */
  ideaId?: string | null;
}

export interface ProjectDashboardSummary {
  project: GameProject;
  openTasks: number;
  doneTasks: number;
  totalTasks: number;
  /** 0..100, derived from tasks. */
  progress: number;
  robloxConnected: boolean;
  lastBuild: { at: IsoDateTime; ok: boolean; summary: string } | null;
  lastTest: { at: IsoDateTime; ok: boolean; summary: string } | null;
}
