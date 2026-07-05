import {
  AiProviderError,
  abortOrNetworkError,
  type AiCompletionRequest,
  type AiCompletionResult,
  type AiProvider,
  type AiProviderStatus,
} from './provider';
import { sseDataLines } from './sse';

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
 * Provider for OpenAI and any OpenAI-compatible endpoint (LM Studio, Ollama,
 * vLLM, OpenRouter, ...). One implementation covers both the OpenAIProvider
 * and the CustomAPIProvider requirement - new vendors are a base URL +
 * model away. Local endpoints usually accept any api key string.
 */
export function createOpenAiCompatibleProvider(opts: OpenAiCompatibleOptions): AiProvider {
  const name = opts.providerName ?? 'openai';
  const baseUrl = (opts.baseUrl ?? OPENAI_BASE_URL).replace(/\/+$/, '');
  const model = opts.model ?? DEFAULT_OPENAI_MODEL;
  const fetchFn = opts.fetchFn ?? globalThis.fetch;
  if (!opts.apiKey || opts.apiKey.trim().length < 4) {
    throw new AiProviderError(`Kein gültiger API-Key für ${name} konfiguriert.`, 'not_configured', false);
  }

  function buildBody(request: AiCompletionRequest, stream: boolean): string {
    const messages: { role: string; content: string }[] = [];
    if (request.system) messages.push({ role: 'system', content: request.system });
    for (const m of request.messages) messages.push({ role: m.role, content: m.content });
    if (request.jsonMode) {
      const last = messages[messages.length - 1];
      if (last && last.role === 'user') {
        last.content +=
          '\n\nAntworte AUSSCHLIESSLICH mit einem einzelnen gültigen JSON-Objekt. Keine Markdown-Zäune, kein Text davor oder danach.';
      }
    }
    return JSON.stringify({
      model,
      max_tokens: request.maxTokens ?? 4096,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(stream ? { stream: true } : {}),
      messages,
    });
  }

  async function post(request: AiCompletionRequest, stream: boolean, signal?: AbortSignal): Promise<Response> {
    let response: Response;
    try {
      response = await fetchFn(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${opts.apiKey}`,
          'content-type': 'application/json',
        },
        body: buildBody(request, stream),
        ...(signal ? { signal } : {}),
      });
    } catch (err) {
      throw abortOrNetworkError(err, baseUrl);
    }
    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) {
        throw new AiProviderError(
          `${name}: API-Key ungültig oder ohne Berechtigung. Prüfe den Key in den Einstellungen.`,
          'auth',
          false,
        );
      }
      if (status === 429) {
        throw new AiProviderError(`${name}: Rate-Limit erreicht. Warte kurz und versuche es erneut.`, 'rate_limit', true);
      }
      if (status === 404) {
        throw new AiProviderError(
          `${name}: Endpunkt oder Modell "${model}" nicht gefunden - Basis-URL und Modellnamen prüfen.`,
          'invalid_response',
          false,
        );
      }
      if (status >= 500) {
        throw new AiProviderError(`${name}: API vorübergehend nicht erreichbar (HTTP ${status}).`, 'network', true);
      }
      throw new AiProviderError(`${name}: Unerwartete Antwort (HTTP ${status}).`, 'unknown', false);
    }
    return response;
  }

  async function complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const response = await post(request, false);
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

  async function completeStream(
    request: AiCompletionRequest,
    onDelta: (delta: string) => void,
    signal?: AbortSignal,
  ): Promise<AiCompletionResult> {
    const response = await post(request, true, signal);
    if (!response.body) {
      throw new AiProviderError(`${name}: Stream ohne Antwortkörper.`, 'invalid_response', false);
    }
    let text = '';
    try {
      for await (const data of sseDataLines(response.body)) {
        if (data === '[DONE]') break;
        let event: { choices?: { delta?: { content?: string } }[] };
        try {
          event = JSON.parse(data) as typeof event;
        } catch {
          continue;
        }
        const delta = event.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          text += delta;
          onDelta(delta);
        }
      }
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      throw abortOrNetworkError(err, baseUrl);
    }
    return { text, provider: name, model, inputTokens: null, outputTokens: null };
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
    completeStream,
  };
}
