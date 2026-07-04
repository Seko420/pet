import {
  AiProviderError,
  type AiCompletionRequest,
  type AiCompletionResult,
  type AiProvider,
  type AiProviderStatus,
} from './provider';

export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-5';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

interface AnthropicOptions {
  apiKey: string;
  model?: string;
  fetchFn?: typeof fetch;
}

/**
 * Direct fetch-based client for the Anthropic Messages API - no SDK
 * dependency, proxy/CA handling stays with the runtime.
 * The API key is captured in a closure and never appears in errors or logs.
 */
export function createAnthropicProvider(opts: AnthropicOptions): AiProvider {
  const model = opts.model ?? DEFAULT_ANTHROPIC_MODEL;
  const fetchFn = opts.fetchFn ?? globalThis.fetch;
  if (!opts.apiKey || opts.apiKey.trim().length < 8) {
    throw new AiProviderError(
      'Kein gültiger Anthropic API-Key konfiguriert.',
      'not_configured',
      false,
    );
  }

  async function complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const messages = request.messages.map((m) => ({ role: m.role, content: m.content }));
    if (request.jsonMode && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last && last.role === 'user') {
        last.content += '\n\nAntworte AUSSCHLIESSLICH mit einem einzelnen gültigen JSON-Objekt. Keine Markdown-Zäune, kein Text davor oder danach.';
      }
    }

    let response: Response;
    try {
      response = await fetchFn(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': opts.apiKey,
          'anthropic-version': API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: request.maxTokens ?? 4096,
          ...(request.system ? { system: request.system } : {}),
          ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
          messages,
        }),
      });
    } catch {
      throw new AiProviderError(
        'Netzwerkfehler beim Kontaktieren der Anthropic API. Prüfe deine Internetverbindung.',
        'network',
        true,
      );
    }

    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) {
        throw new AiProviderError(
          'Anthropic API-Key ungültig oder ohne Berechtigung. Prüfe den Key in den Einstellungen.',
          'auth',
          false,
        );
      }
      if (status === 429) {
        throw new AiProviderError(
          'Anthropic Rate-Limit erreicht. Warte kurz und versuche es erneut.',
          'rate_limit',
          true,
        );
      }
      if (status >= 500) {
        throw new AiProviderError(
          `Anthropic API vorübergehend nicht erreichbar (HTTP ${status}).`,
          'network',
          true,
        );
      }
      throw new AiProviderError(
        `Anthropic API antwortete mit HTTP ${status}.`,
        'unknown',
        false,
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new AiProviderError('Antwort der Anthropic API war kein gültiges JSON.', 'invalid_response', false);
    }

    const body = payload as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };
    const text = body.content?.find((c) => c.type === 'text')?.text;
    if (typeof text !== 'string') {
      throw new AiProviderError(
        'Antwort der Anthropic API enthielt keinen Text-Inhalt.',
        'invalid_response',
        false,
      );
    }

    return {
      text,
      provider: 'anthropic',
      model: body.model ?? model,
      inputTokens: body.usage?.input_tokens ?? null,
      outputTokens: body.usage?.output_tokens ?? null,
    };
  }

  return {
    name: 'anthropic',
    async status(): Promise<AiProviderStatus> {
      return {
        provider: 'anthropic',
        configured: true,
        model,
        detail: `Anthropic ${model} verbunden – Ideen-Verfeinerung, Code-Agent und Commit-Vorschläge nutzen echte KI.`,
      };
    },
    complete,
  };
}
