/**
 * Typed IPC contract between renderer and main process.
 *
 * Every channel is declared once here with its request/response types.
 * - main/ipc/* registers handlers against this map (compile-time checked)
 * - preload exposes a typed `window.egf` API generated from this map
 *
 * Security rules encoded in this contract:
 * - Secrets: only SecretRef metadata crosses IPC; plaintext keys go
 *   renderer -> main exactly once (secrets:set) and never back.
 * - Publishing: roblox:publish requires an explicit `confirmed: true`
 *   plus a prior successful dry run - the main process enforces it.
 */

import type {
  AgentChatMessage,
  AgentRun,
  AnalyticsPlan,
  Checklist,
  ContentItem,
  GameIdea,
  GameProject,
  GddDocument,
  IdeaBrief,
  MobileProjectConfig,
  MonetizationProjection,
  MonetizationScenarioInput,
  NewProjectInput,
  PlaytestFinding,
  PlaytestSession,
  ProjectDashboardSummary,
  RobloxProjectConfig,
  ScoreEvaluation,
  SecretRef,
  SecretService,
  TaskCategory,
  TaskItem,
  TaskPriority,
  TaskStatus,
} from '@egf/core';

// ---------------------------------------------------------------------------
// App-layer DTOs
// ---------------------------------------------------------------------------

export interface AppInfo {
  version: string;
  platform: NodeJS.Platform;
  userDataPath: string;
  dbPath: string;
  safeStorageAvailable: boolean;
}

export interface AiStatusInfo {
  provider: 'mock' | 'anthropic' | 'openai' | 'custom';
  configured: boolean;
  model: string;
  detail: string;
}

/** User-selectable AI provider configuration (stored in app settings). */
export interface AiConfig {
  provider: 'auto' | 'mock' | 'anthropic' | 'openai' | 'custom_ai';
  /** Model override; null = provider default. */
  model: string | null;
  /** Base URL for OpenAI-compatible custom endpoints. */
  customBaseUrl: string | null;
}

export interface BackupInfo {
  fileName: string;
  path: string;
  createdAt: string;
  sizeBytes: number;
}

export interface FileNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  children?: FileNode[];
}

export interface FileContent {
  path: string;
  content: string;
  language: string;
  readOnly: boolean;
}

export interface GitStatusInfo {
  isRepo: boolean;
  branch: string | null;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  ahead: number;
  behind: number;
  lastCommits: { hash: string; message: string; date: string }[];
}

export interface CommitSuggestion {
  message: string;
  body: string;
  files: string[];
}

export interface BuildRequest {
  projectId: string;
  /** Which preconfigured task to run - never a free-form shell string. */
  task: 'rojo_build' | 'rojo_sourcemap' | 'rojo_serve' | 'godot_check' | 'validate_project';
}

export interface BuildOutputEvent {
  runId: string;
  projectId: string;
  stream: 'stdout' | 'stderr' | 'info';
  line: string;
}

export interface BuildExitEvent {
  runId: string;
  projectId: string;
  ok: boolean;
  exitCode: number | null;
  summary: string;
}

export interface RobloxPublishRequest {
  projectId: string;
  /** true = only validate + simulate, nothing is uploaded. */
  dryRun: boolean;
  /**
   * Must be literally true for a real publish. The renderer sets this only
   * after the user typed the project name into the confirmation dialog.
   */
  confirmed: boolean;
  versionType: 'Saved' | 'Published';
}

export interface RobloxPublishResult {
  ok: boolean;
  mode: 'dry_run' | 'published';
  message: string;
  versionNumber: number | null;
  issues: string[];
}

export interface RobloxValidationResult {
  ok: boolean;
  issues: { severity: 'error' | 'warning'; message: string }[];
  checkedFiles: number;
}

export interface RobloxScaffoldResult {
  projectPath: string;
  filesCreated: string[];
}

export interface MobileScaffoldResult {
  projectPath: string;
  filesCreated: string[];
}

export interface SecretSetRequest {
  name: string;
  service: SecretService;
  /** Plaintext value - crosses IPC exactly once, encrypted immediately. */
  value: string;
}

export interface AgentMessageRequest {
  projectId: string;
  message: string;
}

export interface AgentPlanRequest {
  projectId: string;
  goal: string;
}

export interface TaskCreateInput {
  projectId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  milestone?: string;
  estimateHours?: number | null;
}

export interface TaskUpdateInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  milestone?: string;
  estimateHours?: number | null;
  sortOrder?: number;
}

export interface ChecklistState {
  checklist: Checklist;
  completedItemIds: string[];
}

// ---------------------------------------------------------------------------
// Channel map (invoke/handle)
// ---------------------------------------------------------------------------

export interface IpcChannelMap {
  'app:getInfo': { req: undefined; res: AppInfo };
  'app:openPath': { req: { path: string }; res: void };
  'app:pickDirectory': { req: { title?: string }; res: string | null };

  'ai:status': { req: undefined; res: AiStatusInfo };
  'ai:getConfig': { req: undefined; res: AiConfig };
  'ai:setConfig': { req: AiConfig; res: AiConfig };

  'app:createBackup': { req: undefined; res: BackupInfo };
  'app:listBackups': { req: undefined; res: BackupInfo[] };
  'app:restoreBackup': { req: { fileName: string }; res: void };

  'projects:list': { req: undefined; res: GameProject[] };
  'projects:dashboard': { req: undefined; res: ProjectDashboardSummary[] };
  'projects:get': { req: { id: string }; res: GameProject | null };
  'projects:create': { req: NewProjectInput; res: GameProject };
  'projects:update': { req: { id: string; patch: Partial<GameProject> }; res: GameProject };
  'projects:delete': { req: { id: string }; res: void };
  'projects:scaffoldWorkspace': { req: { id: string }; res: { workspacePath: string } };
  /** Export the full project bundle as JSON via save dialog; null = cancelled. */
  'projects:export': { req: { id: string }; res: { path: string } | null };
  /** Import a project bundle via open dialog; null = cancelled. */
  'projects:import': { req: undefined; res: GameProject | null };

  'ideas:generate': { req: IdeaBrief; res: GameIdea[] };
  'ideas:list': { req: undefined; res: GameIdea[] };
  'ideas:get': { req: { id: string }; res: GameIdea | null };
  'ideas:save': { req: GameIdea; res: GameIdea };
  'ideas:delete': { req: { id: string }; res: void };

  'gdd:getForProject': { req: { projectId: string }; res: GddDocument | null };
  'gdd:generate': { req: { projectId: string }; res: GddDocument };
  'gdd:saveSection': {
    req: { projectId: string; sectionId: string; markdown: string };
    res: GddDocument;
  };
  'gdd:exportMarkdown': { req: { projectId: string }; res: { path: string } };

  'tasks:listForProject': { req: { projectId: string }; res: TaskItem[] };
  'tasks:create': { req: TaskCreateInput; res: TaskItem };
  'tasks:update': { req: TaskUpdateInput; res: TaskItem };
  'tasks:delete': { req: { id: string }; res: void };
  'tasks:generateForProject': { req: { projectId: string }; res: TaskItem[] };

  'scores:evaluateProject': { req: { projectId: string }; res: ScoreEvaluation };

  'content:listForProject': { req: { projectId: string }; res: ContentItem[] };
  'content:generatePlan': { req: { projectId: string }; res: ContentItem[] };
  'content:update': { req: { id: string; patch: Partial<ContentItem> }; res: ContentItem };
  'content:delete': { req: { id: string }; res: void };

  'analytics:getPlan': { req: { projectId: string }; res: AnalyticsPlan | null };
  'analytics:generatePlan': { req: { projectId: string }; res: AnalyticsPlan };

  'checklists:getForProject': { req: { projectId: string }; res: ChecklistState[] };
  'checklists:toggleItem': {
    req: { projectId: string; checklistKind: string; itemId: string; done: boolean };
    res: ChecklistState[];
  };

  'secrets:list': { req: undefined; res: SecretRef[] };
  'secrets:set': { req: SecretSetRequest; res: SecretRef };
  'secrets:delete': { req: { id: string }; res: void };

  'roblox:getConfig': { req: { projectId: string }; res: RobloxProjectConfig | null };
  'roblox:saveConfig': {
    req: {
      projectId: string;
      patch: Partial<Pick<RobloxProjectConfig, 'universeId' | 'placeId' | 'apiKeySecretId'>>;
    };
    res: RobloxProjectConfig;
  };
  'roblox:scaffold': { req: { projectId: string }; res: RobloxScaffoldResult };
  'roblox:validate': { req: { projectId: string }; res: RobloxValidationResult };
  'roblox:publish': { req: RobloxPublishRequest; res: RobloxPublishResult };
  'roblox:testConnection': {
    req: { projectId: string };
    res: { ok: boolean; message: string };
  };

  'mobile:getConfig': { req: { projectId: string }; res: MobileProjectConfig | null };
  'mobile:saveConfig': {
    req: { projectId: string; patch: Partial<MobileProjectConfig> };
    res: MobileProjectConfig;
  };
  'mobile:scaffold': { req: { projectId: string }; res: MobileScaffoldResult };

  'files:tree': { req: { projectId: string }; res: FileNode | null };
  'files:read': { req: { projectId: string; path: string }; res: FileContent };
  'files:write': { req: { projectId: string; path: string; content: string }; res: void };

  'agent:history': { req: { projectId: string }; res: AgentChatMessage[] };
  'agent:send': { req: AgentMessageRequest; res: AgentChatMessage[] };
  'agent:plan': { req: AgentPlanRequest; res: AgentRun };
  'agent:approveRun': { req: { runId: string }; res: AgentRun };
  'agent:rejectRun': { req: { runId: string }; res: AgentRun };
  'agent:listRuns': { req: { projectId: string }; res: AgentRun[] };

  'git:status': { req: { projectId: string }; res: GitStatusInfo };
  'git:init': { req: { projectId: string }; res: GitStatusInfo };
  'git:suggestCommit': { req: { projectId: string }; res: CommitSuggestion };
  'git:commit': { req: { projectId: string; message: string }; res: GitStatusInfo };

  'build:run': { req: BuildRequest; res: { runId: string } };
  'build:cancel': { req: { runId: string }; res: void };

  'monetization:defaultScenario': { req: { projectId: string }; res: MonetizationScenarioInput };
  'monetization:simulate': { req: MonetizationScenarioInput; res: MonetizationProjection };

  'playtests:list': { req: { projectId: string }; res: PlaytestSession[] };
  'playtests:create': {
    req: { projectId: string; title: string; playedAt: string; testerCount: number; buildLabel?: string; notes?: string };
    res: PlaytestSession;
  };
  'playtests:delete': { req: { id: string }; res: void };
  'playtests:addFinding': {
    req: { sessionId: string; finding: Omit<PlaytestFinding, 'id' | 'convertedTaskId'> };
    res: PlaytestSession;
  };
  'playtests:removeFinding': { req: { sessionId: string; findingId: string }; res: PlaytestSession };
  'playtests:convertFinding': {
    req: { sessionId: string; findingId: string };
    res: { session: PlaytestSession; task: TaskItem };
  };
}

export type IpcChannel = keyof IpcChannelMap;
export type IpcRequest<C extends IpcChannel> = IpcChannelMap[C]['req'];
export type IpcResponse<C extends IpcChannel> = IpcChannelMap[C]['res'];

// ---------------------------------------------------------------------------
// Events (main -> renderer, fire-and-forget)
// ---------------------------------------------------------------------------

export interface IpcEventMap {
  'event:buildOutput': BuildOutputEvent;
  'event:buildExit': BuildExitEvent;
}

export type IpcEvent = keyof IpcEventMap;
export type IpcEventPayload<E extends IpcEvent> = IpcEventMap[E];

/**
 * Shape of the API exposed on `window.egf` by the preload script.
 */
export interface EgfBridge {
  invoke<C extends IpcChannel>(channel: C, req: IpcRequest<C>): Promise<IpcResponse<C>>;
  on<E extends IpcEvent>(event: E, listener: (payload: IpcEventPayload<E>) => void): () => void;
}
