import { join } from 'node:path';
import { safeStorage } from 'electron';
import { openDatabase, type Db } from '../db/database';
import { SecretsService, createSafeStorageCipher } from './secrets';
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
  git: GitService;
  build: BuildService;
  playtests: PlaytestsService;
  settings: SettingsService;
  backup: BackupService;
  transfer: TransferService;
  logger: Logger;
}

export function createServices(paths: { userDataPath: string; documentsPath: string }): Services {
  const dbPath = join(paths.userDataPath, 'empire-game-forge.sqlite');
  const logger = new Logger(paths.userDataPath);
  logger.info('Starte Services…');
  const db = openDatabase(dbPath);

  const settings = new SettingsService(db);
  const secrets = new SecretsService(db, createSafeStorageCipher(safeStorage));
  const ai = new AiService(secrets, settings);
  const projects = new ProjectsService(db, paths.documentsPath);
  const ideas = new IdeasService(db);
  const gdd = new GddService(db, projects, ideas, paths.documentsPath);
  const tasks = new TasksService(db, projects);
  const scores = new ScoresService(projects);
  const content = new ContentService(db, projects);
  const analytics = new AnalyticsService(db, projects);
  const checklists = new ChecklistsService(db, projects);
  const files = new FilesService(projects);
  const roblox = new RobloxService(projects, secrets);
  const mobile = new MobileService(projects);
  const agent = new AgentService(db, projects, files, ai);
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
