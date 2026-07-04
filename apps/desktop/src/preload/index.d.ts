import type { EgfBridge } from '../shared/ipc';

declare global {
  interface Window {
    egf: EgfBridge;
  }
}

export {};
