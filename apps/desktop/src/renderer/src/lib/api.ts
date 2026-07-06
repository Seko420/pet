import type {
  EgfBridge,
  IpcChannel,
  IpcEvent,
  IpcEventPayload,
  IpcRequest,
  IpcResponse,
} from '@shared/ipc';

/**
 * Single access point for all backend calls.
 * - Desktop (Electron): typed preload bridge on window.egf
 * - Web mode: HTTP bridge (POST /api/invoke/<channel> + SSE /api/events)
 * Screens never care which one is active; `api.mode` tells them if they
 * must adapt (e.g. browser download instead of a save dialog).
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

function createHttpBridge(): EgfBridge {
  let eventSource: EventSource | null = null;
  const listeners = new Map<string, Set<(payload: unknown) => void>>();

  const ensureEventSource = (): void => {
    if (eventSource) return;
    eventSource = new EventSource('/api/events');
    // EventSource reconnects automatically; we only log so a permanently
    // broken stream is visible in the console instead of failing silently.
    eventSource.onerror = () => {
      console.warn('[egf] Live-Event-Verbindung unterbrochen - Browser verbindet automatisch neu…');
    };
    for (const eventName of ['event:buildOutput', 'event:buildExit', 'event:aiChunk', 'event:aiDone']) {
      eventSource.addEventListener(eventName, (message) => {
        let payload: unknown;
        try {
          payload = JSON.parse((message as MessageEvent).data as string) as unknown;
        } catch {
          return; // kaputtes Frame überspringen statt alle Listener zu killen
        }
        for (const listener of listeners.get(eventName) ?? []) listener(payload);
      });
    }
  };

  return {
    async invoke(channel, req) {
      const response = await fetch(`/api/invoke/${channel}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-egf-request': '1' },
        body: JSON.stringify({ req }),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: boolean; result?: unknown; error?: string }
        | null;
      if (!response.ok || !body?.ok) {
        throw new Error(body?.error ?? `Serverfehler (HTTP ${response.status})`);
      }
      return body.result as never;
    },
    on(event, listener) {
      ensureEventSource();
      const set = listeners.get(event) ?? new Set();
      set.add(listener as (payload: unknown) => void);
      listeners.set(event, set);
      return () => {
        set.delete(listener as (payload: unknown) => void);
      };
    },
  };
}

const isDesktop = typeof window !== 'undefined' && Boolean((window as Window).egf);
const httpBridge: EgfBridge | null = isDesktop ? null : createHttpBridge();

function bridge(): EgfBridge {
  if (isDesktop) return (window as Window).egf;
  return httpBridge as EgfBridge;
}

export const api = {
  /** 'desktop' = Electron, 'web' = browser via HTTP bridge. */
  mode: (isDesktop ? 'desktop' : 'web') as 'desktop' | 'web',

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
