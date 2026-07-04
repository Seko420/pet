import type { AiProvider } from '@egf/ai-kit';
import {
  createAnthropicProvider,
  createMockProvider,
  createOpenAiCompatibleProvider,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_OPENAI_MODEL,
} from '@egf/ai-kit';
import type { AiConfig, AiStatusInfo } from '../../shared/ipc';
import type { SecretsService } from './secrets';
import type { SettingsService } from './settings';

const AI_CONFIG_KEY = 'ai.config';

const DEFAULT_CONFIG: AiConfig = {
  provider: 'auto',
  model: null,
  customBaseUrl: null,
};

/**
 * Pluggable AI provider layer.
 * - 'auto': newest stored AI key wins (anthropic > openai > custom_ai)
 * - explicit provider: uses that vendor's stored key
 * - no key / 'mock': honest offline mock; every feature keeps working
 *   through the deterministic engines.
 * Adding a vendor = one factory in @egf/ai-kit + one case here.
 */
export class AiService {
  private cached: { provider: AiProvider; fingerprint: string } | null = null;

  constructor(
    private readonly secrets: SecretsService,
    private readonly settings: SettingsService,
  ) {}

  invalidate(): void {
    this.cached = null;
  }

  getConfig(): AiConfig {
    return this.settings.get<AiConfig>(AI_CONFIG_KEY, DEFAULT_CONFIG);
  }

  setConfig(config: AiConfig): AiConfig {
    if (config.provider === 'custom_ai' && config.customBaseUrl) {
      if (!/^https?:\/\//.test(config.customBaseUrl)) {
        throw new Error('Die Basis-URL muss mit http:// oder https:// beginnen.');
      }
    }
    this.settings.set(AI_CONFIG_KEY, config);
    this.invalidate();
    return config;
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
