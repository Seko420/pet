import { BrowserWindow, app, dialog, ipcMain, safeStorage, shell } from 'electron';
import { resolve, sep } from 'node:path';
import { defaultScenarioForProject, simulateMonetization } from '@egf/core';
import type { IpcChannel, IpcRequest, IpcResponse } from '../../shared/ipc';
import type { Services } from '../services';

/**
 * Registers every channel of the typed IPC contract.
 * The generic `handle` keeps request/response types compiler-checked against
 * shared/ipc.ts - a renderer/main drift becomes a build error, not a runtime bug.
 */
export function registerIpcHandlers(services: Services): void {
  function handle<C extends IpcChannel>(
    channel: C,
    fn: (req: IpcRequest<C>) => Promise<IpcResponse<C>> | IpcResponse<C>,
  ): void {
    ipcMain.handle(channel, async (_event, req: IpcRequest<C>) => {
      try {
        return await fn(req);
      } catch (err) {
        // Log channel + message only - never payloads (they may reference secrets).
        console.error(`[ipc] ${channel} failed:`, err instanceof Error ? err.message : err);
        throw err;
      }
    });
  }

  // ------------------------------------------------------------------- app
  handle('app:getInfo', () => ({
    version: app.getVersion(),
    platform: process.platform,
    userDataPath: services.userDataPath,
    dbPath: services.dbPath,
    safeStorageAvailable: safeStorage.isEncryptionAvailable(),
  }));

  handle('app:openPath', async ({ path }) => {
    // Only app-managed directories may be opened from the renderer.
    const allowedRoots = [
      resolve(services.userDataPath),
      resolve(services.documentsPath, 'EmpireGameForge'),
    ];
    const target = resolve(path);
    const allowed = allowedRoots.some((root) => target === root || target.startsWith(root + sep));
    if (!allowed) throw new Error('Dieser Pfad darf nicht geöffnet werden.');
    const result = await shell.openPath(target);
    if (result) throw new Error(`Ordner konnte nicht geöffnet werden: ${result}`);
  });

  handle('app:pickDirectory', async ({ title }) => {
    const win = BrowserWindow.getFocusedWindow();
    const options = { title: title ?? 'Ordner wählen', properties: ['openDirectory' as const] };
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  handle('ai:status', () => services.ai.status());

  // -------------------------------------------------------------- projects
  handle('projects:list', () => services.projects.list());
  handle('projects:dashboard', () => services.projects.dashboard());
  handle('projects:get', ({ id }) => services.projects.get(id));
  handle('projects:create', (input) => services.projects.create(input));
  handle('projects:update', ({ id, patch }) => services.projects.update(id, patch));
  handle('projects:delete', ({ id }) => services.projects.delete(id));
  handle('projects:scaffoldWorkspace', ({ id }) => services.projects.scaffoldWorkspace(id));

  // ----------------------------------------------------------------- ideas
  handle('ideas:generate', (brief) => services.ideas.generate(brief));
  handle('ideas:list', () => services.ideas.list());
  handle('ideas:get', ({ id }) => services.ideas.get(id));
  handle('ideas:save', (idea) => services.ideas.save(idea));
  handle('ideas:delete', ({ id }) => services.ideas.delete(id));

  // ------------------------------------------------------------------- gdd
  handle('gdd:getForProject', ({ projectId }) => services.gdd.getForProject(projectId));
  handle('gdd:generate', ({ projectId }) => services.gdd.generate(projectId));
  handle('gdd:saveSection', ({ projectId, sectionId, markdown }) =>
    services.gdd.saveSection(projectId, sectionId, markdown),
  );
  handle('gdd:exportMarkdown', ({ projectId }) => services.gdd.exportMarkdown(projectId));

  // ----------------------------------------------------------------- tasks
  handle('tasks:listForProject', ({ projectId }) => services.tasks.listForProject(projectId));
  handle('tasks:create', (input) => services.tasks.create(input));
  handle('tasks:update', (input) => services.tasks.update(input));
  handle('tasks:delete', ({ id }) => services.tasks.delete(id));
  handle('tasks:generateForProject', ({ projectId }) => services.tasks.generateForProject(projectId));

  // ---------------------------------------------------------------- scores
  handle('scores:evaluateProject', ({ projectId }) => services.scores.evaluateProject(projectId));

  // --------------------------------------------------------------- content
  handle('content:listForProject', ({ projectId }) => services.content.listForProject(projectId));
  handle('content:generatePlan', ({ projectId }) => services.content.generatePlan(projectId));
  handle('content:update', ({ id, patch }) => services.content.update(id, patch));
  handle('content:delete', ({ id }) => services.content.delete(id));

  // ------------------------------------------------------------- analytics
  handle('analytics:getPlan', ({ projectId }) => services.analytics.getPlan(projectId));
  handle('analytics:generatePlan', ({ projectId }) => services.analytics.generatePlan(projectId));

  // ------------------------------------------------------------ checklists
  handle('checklists:getForProject', ({ projectId }) => services.checklists.getForProject(projectId));
  handle('checklists:toggleItem', ({ projectId, checklistKind, itemId, done }) =>
    services.checklists.toggleItem(projectId, checklistKind, itemId, done),
  );

  // --------------------------------------------------------------- secrets
  handle('secrets:list', () => services.secrets.list());
  handle('secrets:set', ({ name, service, value }) => {
    const ref = services.secrets.set(name, service, value);
    services.ai.invalidate();
    return ref;
  });
  handle('secrets:delete', ({ id }) => {
    services.secrets.delete(id);
    services.ai.invalidate();
  });

  // ---------------------------------------------------------------- roblox
  handle('roblox:getConfig', ({ projectId }) => services.roblox.getConfig(projectId));
  handle('roblox:saveConfig', ({ projectId, patch }) => services.roblox.saveConfig(projectId, patch));
  handle('roblox:scaffold', ({ projectId }) => services.roblox.scaffold(projectId));
  handle('roblox:validate', ({ projectId }) => services.roblox.validate(projectId));
  handle('roblox:publish', (request) => services.roblox.publish(request));
  handle('roblox:testConnection', ({ projectId }) => services.roblox.testConnection(projectId));

  // ---------------------------------------------------------------- mobile
  handle('mobile:getConfig', ({ projectId }) => services.mobile.getConfig(projectId));
  handle('mobile:saveConfig', ({ projectId, patch }) => services.mobile.saveConfig(projectId, patch));
  handle('mobile:scaffold', ({ projectId }) => services.mobile.scaffold(projectId));

  // ----------------------------------------------------------------- files
  handle('files:tree', ({ projectId }) => services.files.tree(projectId));
  handle('files:read', ({ projectId, path }) => services.files.read(projectId, path));
  handle('files:write', ({ projectId, path, content }) => services.files.write(projectId, path, content));

  // ----------------------------------------------------------------- agent
  handle('agent:history', ({ projectId }) => services.agent.history(projectId));
  handle('agent:send', ({ projectId, message }) => services.agent.send(projectId, message));
  handle('agent:plan', ({ projectId, goal }) => services.agent.plan(projectId, goal));
  handle('agent:approveRun', ({ runId }) => services.agent.approveRun(runId));
  handle('agent:rejectRun', ({ runId }) => services.agent.rejectRun(runId));
  handle('agent:listRuns', ({ projectId }) => services.agent.listRuns(projectId));

  // ------------------------------------------------------------------- git
  handle('git:status', ({ projectId }) => services.git.status(projectId));
  handle('git:init', ({ projectId }) => services.git.init(projectId));
  handle('git:suggestCommit', ({ projectId }) => services.git.suggestCommit(projectId));
  handle('git:commit', ({ projectId, message }) => services.git.commit(projectId, message));

  // ----------------------------------------------------------------- build
  services.build.setSink((event) => {
    const channel = event.type === 'output' ? 'event:buildOutput' : 'event:buildExit';
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(channel, event.payload);
    }
  });
  handle('build:run', (request) => services.build.run(request));
  handle('build:cancel', ({ runId }) => services.build.cancel(runId));

  // ---------------------------------------------------------- monetization
  handle('monetization:defaultScenario', ({ projectId }) =>
    defaultScenarioForProject(services.projects.require(projectId)),
  );
  handle('monetization:simulate', (input) => simulateMonetization(input));

  // ------------------------------------------------------------- playtests
  handle('playtests:list', ({ projectId }) => services.playtests.listForProject(projectId));
  handle('playtests:create', (input) => services.playtests.create(input));
  handle('playtests:delete', ({ id }) => services.playtests.delete(id));
  handle('playtests:addFinding', ({ sessionId, finding }) => services.playtests.addFinding(sessionId, finding));
  handle('playtests:removeFinding', ({ sessionId, findingId }) =>
    services.playtests.removeFinding(sessionId, findingId),
  );
  handle('playtests:convertFinding', ({ sessionId, findingId }) =>
    services.playtests.convertFindingToTask(sessionId, findingId),
  );
}
