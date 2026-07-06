import {
  AiProviderError,
  MAX_STREAM_CHARS,
  REQUEST_TIMEOUT_MS,
  STREAM_TIMEOUT_MS,
  abortOrNetworkError,
  withTimeout,
  type AiCompletionRequest,
  type AiCompletionResult,
  type AiProvider,
  type AiProviderStatus,
} from './provider';
import { sseDataLines } from './sse';

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

  function buildBody(request: AiCompletionRequest, stream: boolean): string {
    const messages = request.messages.map((m) => ({ role: m.role, content: m.content }));
    if (request.jsonMode && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last && last.role === 'user') {
        last.content +=
          '\n\nAntworte AUSSCHLIESSLICH mit einem einzelnen gültigen JSON-Objekt. Keine Markdown-Zäune, kein Text davor oder danach.';
      }
    }
    return JSON.stringify({
      model,
      max_tokens: request.maxTokens ?? 4096,
      ...(request.system ? { system: request.system } : {}),
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(stream ? { stream: true } : {}),
      messages,
    });
  }

  async function post(request: AiCompletionRequest, stream: boolean, signal?: AbortSignal): Promise<Response> {
    let response: Response;
    try {
      response = await fetchFn(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': opts.apiKey,
          'anthropic-version': API_VERSION,
          'content-type': 'application/json',
        },
        body: buildBody(request, stream),
        signal: withTimeout(signal, stream ? STREAM_TIMEOUT_MS : REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      throw abortOrNetworkError(err, 'api.anthropic.com');
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
      throw new AiProviderError(`Anthropic API antwortete mit HTTP ${status}.`, 'unknown', false);
    }
    return response;
  }

  async function complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const response = await post(request, false);
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
      throw new AiProviderError('Antwort der Anthropic API enthielt keinen Text-Inhalt.', 'invalid_response', false);
    }
    return {
      text,
      provider: 'anthropic',
      model: body.model ?? model,
      inputTokens: body.usage?.input_tokens ?? null,
      outputTokens: body.usage?.output_tokens ?? null,
    };
  }

  async function completeStream(
    request: AiCompletionRequest,
    onDelta: (delta: string) => void,
    signal?: AbortSignal,
  ): Promise<AiCompletionResult> {
    const response = await post(request, true, signal);
    if (!response.body) {
      throw new AiProviderError('Anthropic-Stream ohne Antwortkörper.', 'invalid_response', false);
    }
    let text = '';
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    try {
      for await (const data of sseDataLines(response.body)) {
        let event: {
          type?: string;
          delta?: { type?: string; text?: string };
          message?: { usage?: { input_tokens?: number } };
          usage?: { output_tokens?: number };
        };
        try {
          event = JSON.parse(data) as typeof event;
        } catch {
          continue; // keep-alive/ping lines
        }
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta' && event.delta.text) {
          text += event.delta.text;
          if (text.length > MAX_STREAM_CHARS) {
            throw new AiProviderError('anthropic: Antwort überschreitet das Größenlimit - abgebrochen.', 'invalid_response', false);
          }
          onDelta(event.delta.text);
        } else if (event.type === 'message_start' && event.message?.usage?.input_tokens !== undefined) {
          inputTokens = event.message.usage.input_tokens;
        } else if (event.type === 'message_delta' && event.usage?.output_tokens !== undefined) {
          outputTokens = event.usage.output_tokens;
        }
      }
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      throw abortOrNetworkError(err, 'api.anthropic.com');
    }
    return { text, provider: 'anthropic', model, inputTokens, outputTokens };
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
    completeStream,
  };
}
