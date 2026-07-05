import { join } from 'node:path';
import { openDatabase, type Db } from '../db/database';
import { SecretsService, type SecretsCipher } from './secrets';
import { AiService } from './ai';
import { ProjectsService } from './projects';
import {
  AnalyticsService,
  ChecklistsService,
  ContentService,
  GddService,
  IdeasService,
  ScoresService,
  TasksService,
} from './studio';
import { FilesService } from './files';
import { RobloxService } from './roblox';
import { MobileService } from './mobile';
import { AgentService } from './agent';
import { ChatService } from './chat';
import { GitService } from './git';
import { BuildService } from './build';
import { PlaytestsService } from './playtests';
import { SettingsService } from './settings';
import { BackupService } from './backup';
import { TransferService } from './transfer';
import { Logger } from './logger';

export interface Services {
  db: Db;
  dbPath: string;
  userDataPath: string;
  documentsPath: string;
  secrets: SecretsService;
  ai: AiService;
  projects: ProjectsService;
  ideas: IdeasService;
  gdd: GddService;
  tasks: TasksService;
  scores: ScoresService;
  content: ContentService;
  analytics: AnalyticsService;
  checklists: ChecklistsService;
  files: FilesService;
  roblox: RobloxService;
  mobile: MobileService;
  agent: AgentService;
  chat: ChatService;
  git: GitService;
  build: BuildService;
  playtests: PlaytestsService;
  settings: SettingsService;
  backup: BackupService;
  transfer: TransferService;
  logger: Logger;
}

/**
 * Wires the full service graph. Electron-free by design: the secrets cipher
 * is injected (desktop: safeStorage, web: AES key file, tests: fake) so the
 * same backend powers the Electron app AND the self-hosted web mode.
 */
export function createServices(
  paths: { userDataPath: string; documentsPath: string },
  cipher: SecretsCipher,
): Services {
  const dbPath = join(paths.userDataPath, 'empire-game-forge.sqlite');
  const logger = new Logger(paths.userDataPath);
  logger.info('Starte Services…');
  const db = openDatabase(dbPath);

  const settings = new SettingsService(db);
  const secrets = new SecretsService(db, cipher);
  const ai = new AiService(secrets, settings, db);
  const projects = new ProjectsService(db, paths.documentsPath);
  const ideas = new IdeasService(db, ai);
  const gdd = new GddService(db, projects, ideas, paths.documentsPath, ai);
  const tasks = new TasksService(db, projects, ai);
  const scores = new ScoresService(projects, db, ai);
  const content = new ContentService(db, projects);
  const analytics = new AnalyticsService(db, projects);
  const checklists = new ChecklistsService(db, projects);
  const files = new FilesService(projects);
  const roblox = new RobloxService(projects, secrets);
  const mobile = new MobileService(projects);
  const agent = new AgentService(db, projects, files, ai);
  const chat = new ChatService(db, projects, ai);
  const git = new GitService(projects, ai);
  const build = new BuildService(db, projects, roblox);
  const playtests = new PlaytestsService(db, projects, tasks);
  const backup = new BackupService(db, dbPath, paths.userDataPath, logger);
  const transfer = new TransferService(db, projects);
  logger.info('Alle Services bereit.');

  return {
    db,
    dbPath,
    userDataPath: paths.userDataPath,
    documentsPath: paths.documentsPath,
    secrets,
    ai,
    projects,
    ideas,
    gdd,
    tasks,
    scores,
    content,
    analytics,
    checklists,
    files,
    roblox,
    mobile,
    agent,
    chat,
    git,
    build,
    playtests,
    settings,
    backup,
    transfer,
    logger,
  };
}

export function disposeServices(services: Services): void {
  try {
    services.db.close();
  } catch {
    /* already closed */
  }
}
