/**
 * Roblox Open Cloud adapter.
 * Official APIs only - authenticated via x-api-key. The key lives in a
 * closure and never appears in errors, logs or return values.
 */

export type OpenCloudErrorKind =
  | 'auth'
  | 'not_found'
  | 'rate_limit'
  | 'network'
  | 'invalid_file'
  | 'unknown';

export class OpenCloudError extends Error {
  constructor(
    message: string,
    public readonly kind: OpenCloudErrorKind,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'OpenCloudError';
  }
}

export interface PublishPlaceParams {
  universeId: string;
  placeId: string;
  fileContent: Uint8Array;
  fileType: 'rbxl' | 'rbxlx';
  versionType: 'Saved' | 'Published';
}

export interface OpenCloudClient {
  getUniverse(universeId: string): Promise<{ id: string; displayName: string }>;
  publishPlace(params: PublishPlaceParams): Promise<{ versionNumber: number }>;
}

const BASE_CLOUD_V2 = 'https://apis.roblox.com/cloud/v2';
const BASE_UNIVERSES_V1 = 'https://apis.roblox.com/universes/v1';

function mapHttpError(status: number, context: string): OpenCloudError {
  if (status === 401 || status === 403) {
    return new OpenCloudError(
      `${context}: API-Key ungültig oder Scope fehlt (benötigt: universe-places:write, auf das Universe beschränkt).`,
      'auth',
      false,
    );
  }
  if (status === 404) {
    return new OpenCloudError(
      `${context}: Nicht gefunden – Universe ID / Place ID prüfen.`,
      'not_found',
      false,
    );
  }
  if (status === 429) {
    return new OpenCloudError(
      `${context}: Roblox Rate-Limit erreicht – kurz warten und erneut versuchen.`,
      'rate_limit',
      true,
    );
  }
  if (status >= 500) {
    return new OpenCloudError(
      `${context}: Roblox-API vorübergehend nicht erreichbar (HTTP ${status}).`,
      'network',
      true,
    );
  }
  return new OpenCloudError(`${context}: Unerwartete Antwort (HTTP ${status}).`, 'unknown', false);
}

export function createOpenCloudClient(opts: {
  apiKey: string;
  fetchFn?: typeof fetch;
}): OpenCloudClient {
  const fetchFn = opts.fetchFn ?? globalThis.fetch;
  const headers = { 'x-api-key': opts.apiKey };

  return {
    async getUniverse(universeId) {
      let res: Response;
      try {
        res = await fetchFn(`${BASE_CLOUD_V2}/universes/${encodeURIComponent(universeId)}`, {
          headers,
          signal: AbortSignal.timeout(30_000),
        });
      } catch {
        throw new OpenCloudError(
          'Verbindungstest: Netzwerkfehler beim Kontaktieren von apis.roblox.com.',
          'network',
          true,
        );
      }
      if (!res.ok) throw mapHttpError(res.status, 'Verbindungstest');
      const body = (await res.json()) as { path?: string; displayName?: string };
      return { id: universeId, displayName: body.displayName ?? 'Unbenanntes Universe' };
    },

    async publishPlace(params) {
      validatePlaceFileBytes(params.fileContent, params.fileType);
      // Whitelist: the value crosses the web boundary untyped - never let
      // anything but the two documented literals into the URL.
      if (params.versionType !== 'Saved' && params.versionType !== 'Published') {
        throw new OpenCloudError('Publish: Ungültiger versionType.', 'invalid_file', false);
      }
      const url =
        `${BASE_UNIVERSES_V1}/${encodeURIComponent(params.universeId)}` +
        `/places/${encodeURIComponent(params.placeId)}/versions?versionType=${params.versionType}`;
      let res: Response;
      try {
        res = await fetchFn(url, {
          method: 'POST',
          headers: {
            ...headers,
            'content-type':
              params.fileType === 'rbxlx' ? 'application/xml' : 'application/octet-stream',
          },
          body: params.fileContent as unknown as NonNullable<Parameters<typeof fetch>[1]>['body'],
          signal: AbortSignal.timeout(120_000),
        });
      } catch {
        throw new OpenCloudError(
          'Publish: Netzwerkfehler beim Upload zu apis.roblox.com.',
          'network',
          true,
        );
      }
      if (!res.ok) throw mapHttpError(res.status, 'Publish');
      const body = (await res.json()) as { versionNumber?: number };
      if (typeof body.versionNumber !== 'number') {
        throw new OpenCloudError(
          'Publish: Antwort enthielt keine versionNumber.',
          'unknown',
          false,
        );
      }
      return { versionNumber: body.versionNumber };
    },
  };
}

/** Reject obviously invalid place files BEFORE any upload happens. */
export function validatePlaceFileBytes(bytes: Uint8Array, fileType: 'rbxl' | 'rbxlx'): void {
  if (bytes.length < 32) {
    throw new OpenCloudError(
      'Place-Datei ist leer oder zu klein – zuerst „rojo build" ausführen.',
      'invalid_file',
      false,
    );
  }
  const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 64));
  if (fileType === 'rbxl' && !head.startsWith('<roblox!')) {
    throw new OpenCloudError(
      'Datei ist keine gültige .rbxl-Binärdatei (Signatur fehlt).',
      'invalid_file',
      false,
    );
  }
  if (fileType === 'rbxlx' && !head.trimStart().startsWith('<roblox')) {
    throw new OpenCloudError(
      'Datei ist keine gültige .rbxlx-XML-Datei (<roblox>-Wurzel fehlt).',
      'invalid_file',
      false,
    );
  }
}

/** Mock client for offline development and UI tests. */
export function createMockOpenCloudClient(): OpenCloudClient {
  let version = 1;
  return {
    async getUniverse(universeId) {
      if (universeId === '0' || universeId === '') {
        throw new OpenCloudError('Verbindungstest: Nicht gefunden – Universe ID prüfen.', 'not_found', false);
      }
      return { id: universeId, displayName: 'Mock Universe' };
    },
    async publishPlace(params) {
      validatePlaceFileBytes(params.fileContent, params.fileType);
      version += 1;
      return { versionNumber: version };
    },
  };
}
