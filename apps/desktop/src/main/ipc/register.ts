import { BrowserWindow, app, dialog, ipcMain, safeStorage, shell } from 'electron';
import { resolve, sep } from 'node:path';
import type { IpcChannel } from '../../shared/ipc';
import type { Services } from '../services';
import { buildHandlers, type PlatformOps } from './handlers';

/**
 * Desktop adapter: maps the shared handler map onto ipcMain and provides
 * the Electron implementations of the platform-specific operations.
 */
export function registerIpcHandlers(services: Services): void {
  const ops: PlatformOps = {
    mode: 'desktop',
    appVersion: () => app.getVersion(),
    safeStorageAvailable: () => safeStorage.isEncryptionAvailable(),

    async openPath(path) {
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
    },

    async pickDirectory(title) {
      const win = BrowserWindow.getFocusedWindow();
      const options = { title: title ?? 'Ordner wählen', properties: ['openDirectory' as const] };
      const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : (result.filePaths[0] ?? null);
    },

    async exportProjectDialog(projectId) {
      const project = services.projects.require(projectId);
      const win = BrowserWindow.getFocusedWindow();
      const options = {
        title: 'Projekt exportieren',
        defaultPath: `${project.slug}.egf.json`,
        filters: [{ name: 'Empire Game Forge Projekt', extensions: ['json'] }],
      };
      const result = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
      if (result.canceled || !result.filePath) return null;
      services.transfer.exportToFile(projectId, result.filePath);
      services.logger.info(`Projekt exportiert: ${project.slug}`);
      return { path: result.filePath };
    },

    async importProjectDialog() {
      const win = BrowserWindow.getFocusedWindow();
      const options = {
        title: 'Projekt importieren',
        filters: [{ name: 'Empire Game Forge Projekt', extensions: ['json'] }],
        properties: ['openFile' as const],
      };
      const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
      const filePath = result.filePaths[0];
      if (result.canceled || !filePath) return null;
      const project = services.transfer.importFromFile(filePath);
      services.logger.info(`Projekt importiert: ${project.slug}`);
      return project;
    },

    afterBackupRestore() {
      app.relaunch();
      app.exit(0);
    },
  };

  const handlers = buildHandlers(services, ops);
  for (const channel of Object.keys(handlers) as IpcChannel[]) {
    ipcMain.handle(channel, async (_event, req: unknown) => {
      try {
        return await (handlers[channel] as (r: unknown) => Promise<unknown>)(req);
      } catch (err) {
        // Log channel + message only - never payloads (they may reference secrets).
        services.logger.error(`ipc ${channel}: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
      }
    });
  }

  // Build events: broadcast to all renderer windows.
  services.build.setSink((event) => {
    const channel = event.type === 'output' ? 'event:buildOutput' : 'event:buildExit';
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(channel, event.payload);
    }
  });
}
