import {
  AiProviderError,
  type AiCompletionRequest,
  type AiCompletionResult,
  type AiProvider,
  type AiProviderStatus,
} from './provider';

export const DEFAULT_OPENAI_MODEL = 'gpt-4o';
export const OPENAI_BASE_URL = 'https://api.openai.com/v1';

interface OpenAiCompatibleOptions {
  apiKey: string;
  /** Base URL up to (excluding) /chat/completions, e.g. https://api.openai.com/v1 */
  baseUrl?: string;
  model?: string;
  /** Display name: 'openai' or 'custom'. */
  providerName?: string;
  fetchFn?: typeof fetch;
}

/**
 * Provider for OpenAI and any OpenAI-compatible endpoint (LM Studio, Ollama
 * with openai compat, vLLM, OpenRouter, ...). One implementation covers both
 * the OpenAIProvider and the CustomAPIProvider requirement - new vendors are
 * a base URL + model away.
 */
export function createOpenAiCompatibleProvider(opts: OpenAiCompatibleOptions): AiProvider {
  const name = opts.providerName ?? 'openai';
  const baseUrl = (opts.baseUrl ?? OPENAI_BASE_URL).replace(/\/+$/, '');
  const model = opts.model ?? DEFAULT_OPENAI_MODEL;
  const fetchFn = opts.fetchFn ?? globalThis.fetch;
  if (!opts.apiKey || opts.apiKey.trim().length < 4) {
    throw new AiProviderError(`Kein gültiger API-Key für ${name} konfiguriert.`, 'not_configured', false);
  }

  async function complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const messages: { role: string; content: string }[] = [];
    if (request.system) messages.push({ role: 'system', content: request.system });
    for (const m of request.messages) messages.push({ role: m.role, content: m.content });
    if (request.jsonMode) {
      const last = messages[messages.length - 1];
      if (last && last.role === 'user') {
        last.content += '\n\nAntworte AUSSCHLIESSLICH mit einem einzelnen gültigen JSON-Objekt. Keine Markdown-Zäune, kein Text davor oder danach.';
      }
    }

    let response: Response;
    try {
      response = await fetchFn(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${opts.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: request.maxTokens ?? 4096,
          ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
          messages,
        }),
      });
    } catch {
      throw new AiProviderError(
        `Netzwerkfehler beim Kontaktieren von ${baseUrl}. Prüfe URL und Internetverbindung.`,
        'network',
        true,
      );
    }

    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) {
        throw new AiProviderError(`${name}: API-Key ungültig oder ohne Berechtigung. Prüfe den Key in den Einstellungen.`, 'auth', false);
      }
      if (status === 429) {
        throw new AiProviderError(`${name}: Rate-Limit erreicht. Warte kurz und versuche es erneut.`, 'rate_limit', true);
      }
      if (status === 404) {
        throw new AiProviderError(`${name}: Endpunkt oder Modell "${model}" nicht gefunden - Basis-URL und Modellnamen prüfen.`, 'invalid_response', false);
      }
      if (status >= 500) {
        throw new AiProviderError(`${name}: API vorübergehend nicht erreichbar (HTTP ${status}).`, 'network', true);
      }
      throw new AiProviderError(`${name}: Unerwartete Antwort (HTTP ${status}).`, 'unknown', false);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new AiProviderError(`${name}: Antwort war kein gültiges JSON.`, 'invalid_response', false);
    }
    const body = payload as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    };
    const text = body.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new AiProviderError(`${name}: Antwort enthielt keinen Text-Inhalt.`, 'invalid_response', false);
    }
    return {
      text,
      provider: name,
      model: body.model ?? model,
      inputTokens: body.usage?.prompt_tokens ?? null,
      outputTokens: body.usage?.completion_tokens ?? null,
    };
  }

  return {
    name,
    async status(): Promise<AiProviderStatus> {
      return {
        provider: name,
        configured: true,
        model,
        detail: `${name === 'openai' ? 'OpenAI' : `Eigene API (${baseUrl})`} verbunden - Modell ${model}.`,
      };
    },
    complete,
  };
}
