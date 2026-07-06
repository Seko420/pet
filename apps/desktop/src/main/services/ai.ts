import type { AiCompletionRequest, AiCompletionResult, AiProvider } from '@egf/ai-kit';
import {
  AiProviderError,
  createAnthropicProvider,
  createMockProvider,
  createOpenAiCompatibleProvider,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_OPENAI_MODEL,
} from '@egf/ai-kit';
import { createId, nowIso } from '@egf/core';
import type { AiConfig, AiStatusInfo } from '../../shared/ipc';
import type { Db } from '../db/database';
import type { SecretsService } from './secrets';
import type { SettingsService } from './settings';

const AI_CONFIG_KEY = 'ai.config';

const DEFAULT_CONFIG: AiConfig = {
  provider: 'auto',
  model: null,
  customBaseUrl: null,
  temperature: null,
  maxTokens: null,
};

/**
 * Pluggable AI provider layer.
 * - 'auto': newest stored AI key wins (anthropic > openai > custom_ai)
 * - explicit provider: uses that vendor's stored key
 * - no key / 'mock': honest offline mock; every feature keeps working
 *   through the deterministic engines.
 * All calls go through run()/runStream() so temperature/maxTokens defaults
 * apply and every request lands in the metadata-only request log
 * (never message content, never keys).
 */
export class AiService {
  private cached: { provider: AiProvider; fingerprint: string } | null = null;

  constructor(
    private readonly secrets: SecretsService,
    private readonly settings: SettingsService,
    private readonly db?: Db,
  ) {}

  invalidate(): void {
    this.cached = null;
  }

  getConfig(): AiConfig {
    return { ...DEFAULT_CONFIG, ...this.settings.get<Partial<AiConfig>>(AI_CONFIG_KEY, {}) };
  }

  setConfig(config: AiConfig): AiConfig {
    if (config.provider === 'custom_ai' && config.customBaseUrl) {
      if (!/^https?:\/\//.test(config.customBaseUrl)) {
        throw new Error('Die Basis-URL muss mit http:// oder https:// beginnen.');
      }
      // localhost/private bleibt erlaubt (LM Studio/Ollama), aber Link-Local-/
      // Cloud-Metadata-Adressen sind nie ein legitimer KI-Endpunkt (SSRF).
      try {
        const host = new URL(config.customBaseUrl).hostname;
        if (host === '169.254.169.254' || host.startsWith('169.254.') || host === 'metadata.google.internal' || host === '[fe80::1]' || host.startsWith('fe80:')) {
          throw new Error('Diese Adresse ist als KI-Endpunkt nicht erlaubt.');
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('nicht erlaubt')) throw err;
        throw new Error('Die Basis-URL ist keine gültige URL.');
      }
    }
    if (config.temperature !== null && (config.temperature < 0 || config.temperature > 1)) {
      throw new Error('Temperatur muss zwischen 0 und 1 liegen.');
    }
    if (config.maxTokens !== null && (config.maxTokens < 100 || config.maxTokens > 64000)) {
      throw new Error('Max. Tokens muss zwischen 100 und 64000 liegen.');
    }
    this.settings.set(AI_CONFIG_KEY, config);
    this.invalidate();
    return config;
  }

  isConfigured(): boolean {
    return this.resolveProviderKind(this.getConfig()) !== 'mock';
  }

  private resolveProviderKind(config: AiConfig): 'anthropic' | 'openai' | 'custom_ai' | 'mock' {
    if (config.provider === 'mock') return 'mock';
    if (config.provider !== 'auto') {
      return this.secrets.latestRefFor(config.provider) ? config.provider : 'mock';
    }
    for (const kind of ['anthropic', 'openai', 'custom_ai'] as const) {
      if (this.secrets.latestRefFor(kind)) return kind;
    }
    return 'mock';
  }

  getProvider(): AiProvider {
    const config = this.getConfig();
    const kind = this.resolveProviderKind(config);
    const ref = kind === 'mock' ? null : this.secrets.latestRefFor(kind);
    const fingerprint = `${kind}:${ref?.id ?? '-'}:${config.model ?? '-'}:${config.customBaseUrl ?? '-'}`;
    if (this.cached && this.cached.fingerprint === fingerprint) return this.cached.provider;

    let provider: AiProvider;
    try {
      if (kind === 'mock' || !ref) {
        provider = createMockProvider();
      } else if (kind === 'anthropic') {
        provider = createAnthropicProvider({
          apiKey: this.secrets.getPlaintext(ref.id),
          model: config.model ?? undefined,
        });
      } else if (kind === 'openai') {
        provider = createOpenAiCompatibleProvider({
          apiKey: this.secrets.getPlaintext(ref.id),
          model: config.model ?? undefined,
          providerName: 'openai',
        });
      } else {
        if (!config.customBaseUrl) {
          throw new Error('Für die eigene KI-API fehlt die Basis-URL (Einstellungen → KI-Anbindung).');
        }
        provider = createOpenAiCompatibleProvider({
          apiKey: this.secrets.getPlaintext(ref.id),
          baseUrl: config.customBaseUrl,
          model: config.model ?? 'default',
          providerName: 'custom',
        });
      }
    } catch (err) {
      console.error('[AiService] Provider nicht initialisierbar:', err instanceof Error ? err.message : err);
      provider = createMockProvider();
    }
    this.cached = { provider, fingerprint };
    return provider;
  }

  // ------------------------------------------------------------- execution

  private applyDefaults(request: AiCompletionRequest): AiCompletionRequest {
    const config = this.getConfig();
    return {
      ...request,
      temperature: request.temperature ?? config.temperature ?? undefined,
      maxTokens: request.maxTokens ?? config.maxTokens ?? undefined,
    };
  }

  private log(kind: string, provider: string, model: string, ok: boolean, startedAt: number, error?: string): void {
    if (!this.db) return;
    try {
      this.db
        .prepare('INSERT INTO ai_request_log (id, at, provider, model, kind, ok, duration_ms, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(createId('ail'), nowIso(), provider, model, kind, ok ? 1 : 0, Date.now() - startedAt, error?.slice(0, 300) ?? null);
    } catch {
      /* logging must never break the request */
    }
  }

  /** Non-streamed call with defaults + request logging. */
  async run(kind: string, request: AiCompletionRequest): Promise<AiCompletionResult> {
    const provider = this.getProvider();
    const startedAt = Date.now();
    try {
      const result = await provider.complete(this.applyDefaults(request));
      this.log(kind, result.provider, result.model, true, startedAt);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log(kind, provider.name, '-', false, startedAt, message);
      throw err;
    }
  }

  /** Streamed call with defaults + request logging. */
  async runStream(
    kind: string,
    request: AiCompletionRequest,
    onDelta: (delta: string) => void,
    signal?: AbortSignal,
  ): Promise<AiCompletionResult> {
    const provider = this.getProvider();
    const startedAt = Date.now();
    try {
      const result = await provider.completeStream(this.applyDefaults(request), onDelta, signal);
      this.log(kind, result.provider, result.model, true, startedAt);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log(kind, provider.name, '-', false, startedAt, message);
      throw err;
    }
  }

  /**
   * Requires a REAL provider; throws a clear German error in mock mode.
   * Used by the AI-only features (idea gen, GDD improve, review, task plan).
   */
  requireRealProvider(): AiProvider {
    if (!this.isConfigured()) {
      throw new Error(
        'Für diese Funktion wird eine echte KI benötigt. Hinterlege in den Einstellungen einen API-Schlüssel (Anthropic/OpenAI) oder verbinde eine kostenlose lokale KI (LM Studio/Ollama) – siehe docs/KI-SETUP.md.',
      );
    }
    return this.getProvider();
  }

  /** Sends a tiny real request to verify key/URL/model. */
  async testConnection(): Promise<{ ok: boolean; message: string; model: string }> {
    const config = this.getConfig();
    const kind = this.resolveProviderKind(config);
    if (kind === 'mock') {
      return {
        ok: true,
        message:
          config.provider === 'mock'
            ? 'Mock-Modus aktiv - kein externer Aufruf, alles offline. Für echte KI einen Anbieter + Schlüssel wählen.'
            : 'Kein passender API-Schlüssel gefunden - die App läuft im Mock-Modus. Schlüssel unter "API-Schlüssel" hinterlegen.',
        model: 'mock',
      };
    }
    try {
      const result = await this.run('test_connection', {
        messages: [{ role: 'user', content: 'Antworte mit genau einem Wort: OK' }],
        maxTokens: 10,
        temperature: 0,
      });
      return { ok: true, message: `Verbindung erfolgreich - Modell ${result.model} hat geantwortet.`, model: result.model };
    } catch (err) {
      const message = err instanceof AiProviderError ? err.message : `Verbindungstest fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`;
      return { ok: false, message, model: '-' };
    }
  }

  async status(): Promise<AiStatusInfo> {
    const provider = this.getProvider();
    const status = await provider.status();
    const config = this.getConfig();
    return {
      provider: (provider.name as AiStatusInfo['provider']) ?? 'mock',
      configured: status.configured,
      model: status.configured
        ? status.model
        : config.provider === 'openai'
          ? DEFAULT_OPENAI_MODEL
          : DEFAULT_ANTHROPIC_MODEL,
      detail: status.detail,
    };
  }
}
