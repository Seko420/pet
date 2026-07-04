import type {
  EgfBridge,
  IpcChannel,
  IpcEvent,
  IpcEventPayload,
  IpcRequest,
  IpcResponse,
} from '@shared/ipc';

/**
 * Thin typed wrapper around the preload bridge.
 * All screens call `api.invoke(...)` / `api.on(...)` - never window.egf
 * directly - so error handling and future telemetry live in one place.
 */

class ApiError extends Error {
  constructor(
    message: string,
    public readonly channel: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function bridge(): EgfBridge {
  const b = (window as Window).egf;
  if (!b) {
    throw new ApiError(
      'Preload-Bridge nicht verfuegbar. Die App muss ueber Electron gestartet werden (npm run dev).',
      'bridge',
    );
  }
  return b;
}

export const api = {
  async invoke<C extends IpcChannel>(channel: C, req: IpcRequest<C>): Promise<IpcResponse<C>> {
    try {
      return await bridge().invoke(channel, req);
    } catch (err) {
      // Electron wraps handler errors; unwrap to a clean message for the UI.
      const raw = err instanceof Error ? err.message : String(err);
      const clean = raw.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, '');
      throw new ApiError(clean, channel);
    }
  },

  on<E extends IpcEvent>(event: E, listener: (payload: IpcEventPayload<E>) => void): () => void {
    return bridge().on(event, listener);
  },
};

export { ApiError };
