import { app, BrowserWindow, shell } from 'electron';
import { join } from 'node:path';
import { createServices, disposeServices, type Services } from './services';
import { registerIpcHandlers } from './ipc/register';

let services: Services | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: '#0b0e14',
    autoHideMenuBar: true,
    title: 'Empire Game Forge AI',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.on('ready-to-show', () => win.show());

  // External links open in the default browser, never inside the app shell.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }
  return win;
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.empiregameforge.app');

  services = createServices({
    userDataPath: app.getPath('userData'),
    documentsPath: app.getPath('documents'),
  });
  registerIpcHandlers(services);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (services) {
    disposeServices(services);
    services = null;
  }
});
