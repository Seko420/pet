import type { AiProvider } from '@egf/ai-kit';
import { createAnthropicProvider, createMockProvider, DEFAULT_ANTHROPIC_MODEL } from '@egf/ai-kit';
import type { AiStatusInfo } from '../../shared/ipc';
import type { SecretsService } from './secrets';

/**
 * Resolves the active AI provider from the secrets store.
 * No key -> honest mock provider; features stay functional via heuristics.
 */
export class AiService {
  private cached: { provider: AiProvider; secretId: string | null } | null = null;

  constructor(private readonly secrets: SecretsService) {}

  /** Call whenever secrets change. */
  invalidate(): void {
    this.cached = null;
  }

  getProvider(): AiProvider {
    const ref = this.secrets.latestRefFor('anthropic');
    const secretId = ref?.id ?? null;
    if (this.cached && this.cached.secretId === secretId) {
      return this.cached.provider;
    }
    let provider: AiProvider;
    if (ref) {
      try {
        provider = createAnthropicProvider({ apiKey: this.secrets.getPlaintext(ref.id) });
      } catch (err) {
        console.error('[AiService] Anthropic-Provider nicht initialisierbar:', err instanceof Error ? err.message : err);
        provider = createMockProvider();
      }
    } else {
      provider = createMockProvider();
    }
    this.cached = { provider, secretId };
    return provider;
  }

  async status(): Promise<AiStatusInfo> {
    const provider = this.getProvider();
    const status = await provider.status();
    return {
      provider: provider.name === 'anthropic' ? 'anthropic' : 'mock',
      configured: status.configured,
      model: status.configured ? status.model : DEFAULT_ANTHROPIC_MODEL,
      detail: status.detail,
    };
  }
}
