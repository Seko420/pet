import { contextBridge, ipcRenderer } from 'electron';
import type { EgfBridge, IpcChannel, IpcEvent } from '../shared/ipc';

/**
 * Minimal, typed bridge. No Node APIs are exposed to the renderer -
 * everything goes through explicit, whitelisted invoke channels.
 */
const bridge: EgfBridge = {
  invoke: (channel: IpcChannel, req) => ipcRenderer.invoke(channel, req),
  on: (event: IpcEvent, listener) => {
    const wrapped = (_e: Electron.IpcRendererEvent, payload: unknown): void => {
      listener(payload as never);
    };
    ipcRenderer.on(event, wrapped);
    return () => ipcRenderer.removeListener(event, wrapped);
  },
};

contextBridge.exposeInMainWorld('egf', bridge);
