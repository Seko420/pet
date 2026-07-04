import type { GameProject } from '@egf/core';
import { defaultScenarioForProject, simulateMonetization } from '@egf/core';
import type { IpcChannel, IpcRequest, IpcResponse } from '../../shared/ipc';
import type { Services } from '../services';

/**
 * The complete, Electron-FREE channel dispatcher. Both frontends register it:
 * - desktop: ipc/register.ts maps it onto ipcMain.handle
 * - web:     apps/server maps it onto POST /api/invoke/:channel
 * Platform-specific behavior (dialogs, opening folders, relaunch) is injected
 * via PlatformOps, so feature parity is a compile-time property.
 */

export interface PlatformOps {
  mode: 'desktop' | 'web';
  appVersion(): string;
  safeStorageAvailable(): boolean;
  /** Open a path in the OS file manager (desktop) or explain the server path (web). */
  openPath(path: string): Promise<void>;
  pickDirectory(title?: string): Promise<string | null>;
  /** Dialog-based export/import (desktop); web falls back to exportData/importData. */
  exportProjectDialog(projectId: string): Promise<{ path: string } | null>;
  importProjectDialog(): Promise<GameProject | null>;
  /** Called after a backup restore replaced the DB file. */
  afterBackupRestore(): void;
}

export type HandlerMap = {
  [C in IpcChannel]: (req: IpcRequest<C>) => Promise<IpcResponse<C>> | IpcResponse<C>;
};

export function buildHandlers(services: Services, ops: PlatformOps): HandlerMap {
  return {
    // ------------------------------------------------------------------ app
    'app:getInfo': () => ({
      version: ops.appVersion(),
      platform: process.platform,
      mode: ops.mode,
      userDataPath: services.userDataPath,
      dbPath: services.dbPath,
      safeStorageAvailable: ops.safeStorageAvailable(),
    }),
    'app:openPath': ({ path }) => ops.openPath(path),
    'app:pickDirectory': ({ title }) => ops.pickDirectory(title),

    'app:createBackup': () => services.backup.create(),
    'app:listBackups': () => services.backup.list(),
    'app:restoreBackup': ({ fileName }) => {
      services.logger.warn(`Backup-Wiederherstellung angefordert: ${fileName}`);
      services.db.close();
      services.backup.restoreAfterDbClosed(fileName);
      ops.afterBackupRestore();
    },

    'ai:status': () => services.ai.status(),
    'ai:getConfig': () => services.ai.getConfig(),
    'ai:setConfig': (config) => services.ai.setConfig(config),

    // ------------------------------------------------------------- projects
    'projects:list': () => services.projects.list(),
    'projects:dashboard': () => services.projects.dashboard(),
    'projects:get': ({ id }) => services.projects.get(id),
    'projects:create': (input) => services.projects.create(input),
    'projects:update': ({ id, patch }) => services.projects.update(id, patch),
    'projects:delete': ({ id }) => services.projects.delete(id),
    'projects:scaffoldWorkspace': ({ id }) => services.projects.scaffoldWorkspace(id),
    'projects:export': ({ id }) => ops.exportProjectDialog(id),
    'projects:import': () => ops.importProjectDialog(),
    'projects:exportData': ({ id }) => services.transfer.exportData(id),
    'projects:importData': ({ json }) => services.transfer.importData(json),

    // ---------------------------------------------------------------- ideas
    'ideas:generate': (brief) => services.ideas.generate(brief),
    'ideas:list': () => services.ideas.list(),
    'ideas:get': ({ id }) => services.ideas.get(id),
    'ideas:save': (idea) => services.ideas.save(idea),
    'ideas:delete': ({ id }) => services.ideas.delete(id),

    // ------------------------------------------------------------------ gdd
    'gdd:getForProject': ({ projectId }) => services.gdd.getForProject(projectId),
    'gdd:generate': ({ projectId }) => services.gdd.generate(projectId),
    'gdd:saveSection': ({ projectId, sectionId, markdown }) =>
      services.gdd.saveSection(projectId, sectionId, markdown),
    'gdd:exportMarkdown': ({ projectId }) => services.gdd.exportMarkdown(projectId),

    // ---------------------------------------------------------------- tasks
    'tasks:listForProject': ({ projectId }) => services.tasks.listForProject(projectId),
    'tasks:create': (input) => services.tasks.create(input),
    'tasks:update': (input) => services.tasks.update(input),
    'tasks:delete': ({ id }) => services.tasks.delete(id),
    'tasks:generateForProject': ({ projectId }) => services.tasks.generateForProject(projectId),

    'scores:evaluateProject': ({ projectId }) => services.scores.evaluateProject(projectId),

    // -------------------------------------------------------------- content
    'content:listForProject': ({ projectId }) => services.content.listForProject(projectId),
    'content:generatePlan': ({ projectId }) => services.content.generatePlan(projectId),
    'content:update': ({ id, patch }) => services.content.update(id, patch),
    'content:delete': ({ id }) => services.content.delete(id),

    'analytics:getPlan': ({ projectId }) => services.analytics.getPlan(projectId),
    'analytics:generatePlan': ({ projectId }) => services.analytics.generatePlan(projectId),

    'checklists:getForProject': ({ projectId }) => services.checklists.getForProject(projectId),
    'checklists:toggleItem': ({ projectId, checklistKind, itemId, done }) =>
      services.checklists.toggleItem(projectId, checklistKind, itemId, done),

    // -------------------------------------------------------------- secrets
    'secrets:list': () => services.secrets.list(),
    'secrets:set': ({ name, service, value }) => {
      const ref = services.secrets.set(name, service, value);
      services.ai.invalidate();
      return ref;
    },
    'secrets:delete': ({ id }) => {
      services.secrets.delete(id);
      services.ai.invalidate();
    },

    // --------------------------------------------------------------- roblox
    'roblox:getConfig': ({ projectId }) => services.roblox.getConfig(projectId),
    'roblox:saveConfig': ({ projectId, patch }) => services.roblox.saveConfig(projectId, patch),
    'roblox:scaffold': ({ projectId }) => services.roblox.scaffold(projectId),
    'roblox:validate': ({ projectId }) => services.roblox.validate(projectId),
    'roblox:publish': (request) => services.roblox.publish(request),
    'roblox:testConnection': ({ projectId }) => services.roblox.testConnection(projectId),

    // --------------------------------------------------------------- mobile
    'mobile:getConfig': ({ projectId }) => services.mobile.getConfig(projectId),
    'mobile:saveConfig': ({ projectId, patch }) => services.mobile.saveConfig(projectId, patch),
    'mobile:scaffold': ({ projectId }) => services.mobile.scaffold(projectId),

    // ---------------------------------------------------------------- files
    'files:tree': ({ projectId }) => services.files.tree(projectId),
    'files:read': ({ projectId, path }) => services.files.read(projectId, path),
    'files:write': ({ projectId, path, content }) => services.files.write(projectId, path, content),

    // ---------------------------------------------------------------- agent
    'agent:history': ({ projectId }) => services.agent.history(projectId),
    'agent:send': ({ projectId, message }) => services.agent.send(projectId, message),
    'agent:plan': ({ projectId, goal }) => services.agent.plan(projectId, goal),
    'agent:approveRun': ({ runId }) => services.agent.approveRun(runId),
    'agent:rejectRun': ({ runId }) => services.agent.rejectRun(runId),
    'agent:listRuns': ({ projectId }) => services.agent.listRuns(projectId),

    // ------------------------------------------------------------------ git
    'git:status': ({ projectId }) => services.git.status(projectId),
    'git:init': ({ projectId }) => services.git.init(projectId),
    'git:suggestCommit': ({ projectId }) => services.git.suggestCommit(projectId),
    'git:commit': ({ projectId, message }) => services.git.commit(projectId, message),

    // ---------------------------------------------------------------- build
    'build:run': (request) => services.build.run(request),
    'build:cancel': ({ runId }) => services.build.cancel(runId),

    // ---------------------------------------------------------- monetization
    'monetization:defaultScenario': ({ projectId }) =>
      defaultScenarioForProject(services.projects.require(projectId)),
    'monetization:simulate': (input) => simulateMonetization(input),

    // ------------------------------------------------------------- playtests
    'playtests:list': ({ projectId }) => services.playtests.listForProject(projectId),
    'playtests:create': (input) => services.playtests.create(input),
    'playtests:delete': ({ id }) => services.playtests.delete(id),
    'playtests:addFinding': ({ sessionId, finding }) => services.playtests.addFinding(sessionId, finding),
    'playtests:removeFinding': ({ sessionId, findingId }) =>
      services.playtests.removeFinding(sessionId, findingId),
    'playtests:convertFinding': ({ sessionId, findingId }) =>
      services.playtests.convertFindingToTask(sessionId, findingId),
  };
}
