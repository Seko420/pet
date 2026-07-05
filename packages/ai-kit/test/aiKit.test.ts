import { describe, expect, it } from 'vitest';
import {
  AiProviderError,
  createAnthropicProvider,
  createMockProvider,
  createOpenAiCompatibleProvider,
  buildAgentPlanPrompt,
} from '../src/index';

const SECRET_KEY = 'sk-ant-test-geheim-1234567890';

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;
}

describe('mock provider', () => {
  it('returns parseable JSON in jsonMode and is honest about mock mode', async () => {
    const provider = createMockProvider();
    const result = await provider.complete({
      messages: [{ role: 'user', content: 'Plan bitte' }],
      jsonMode: true,
    });
    expect(() => JSON.parse(result.text)).not.toThrow();
    expect(JSON.parse(result.text).note).toBe('mock');
    const status = await provider.status();
    expect(status.configured).toBe(false);
    expect(status.detail).toContain('Mock');
  });
});

describe('anthropic provider', () => {
  it('maps a successful response', async () => {
    const provider = createAnthropicProvider({
      apiKey: SECRET_KEY,
      fetchFn: fakeFetch(200, {
        content: [{ type: 'text', text: 'Hallo Studio' }],
        usage: { input_tokens: 12, output_tokens: 5 },
        model: 'claude-sonnet-5',
      }),
    });
    const result = await provider.complete({ messages: [{ role: 'user', content: 'Hi' }] });
    expect(result.text).toBe('Hallo Studio');
    expect(result.inputTokens).toBe(12);
    expect(result.provider).toBe('anthropic');
  });

  it.each([
    [401, 'auth', false],
    [429, 'rate_limit', true],
    [503, 'network', true],
  ] as const)('maps HTTP %s to %s', async (status, kind, retryable) => {
    const provider = createAnthropicProvider({
      apiKey: SECRET_KEY,
      fetchFn: fakeFetch(status, { error: { message: 'nope' } }),
    });
    try {
      await provider.complete({ messages: [{ role: 'user', content: 'Hi' }] });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(AiProviderError);
      const e = err as AiProviderError;
      expect(e.kind).toBe(kind);
      expect(e.retryable).toBe(retryable);
      // The API key must never leak into error messages.
      expect(e.message).not.toContain(SECRET_KEY);
    }
  });
});

describe('openai-compatible provider', () => {
  it('maps success and auth errors, honoring a custom base url', async () => {
    let capturedUrl = '';
    const ok = createOpenAiCompatibleProvider({
      apiKey: SECRET_KEY,
      baseUrl: 'http://localhost:1234/v1/',
      providerName: 'custom',
      fetchFn: (async (...args: Parameters<typeof fetch>) => {
        capturedUrl = String(args[0]);
        return new Response(
          JSON.stringify({ choices: [{ message: { content: 'Hi' } }], usage: { prompt_tokens: 3, completion_tokens: 1 } }),
          { status: 200 },
        );
      }) as typeof fetch,
    });
    const result = await ok.complete({ messages: [{ role: 'user', content: 'Hallo' }] });
    expect(result.text).toBe('Hi');
    expect(result.provider).toBe('custom');
    expect(capturedUrl).toBe('http://localhost:1234/v1/chat/completions');

    const denied = createOpenAiCompatibleProvider({
      apiKey: SECRET_KEY,
      fetchFn: fakeFetch(401, {}),
    });
    await expect(denied.complete({ messages: [{ role: 'user', content: 'x' }] })).rejects.toMatchObject({ kind: 'auth' });
  });
});

function sseResponse(frames: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const frame of frames) controller.enqueue(encoder.encode(frame));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

describe('streaming', () => {
  it('parses anthropic SSE deltas and usage', async () => {
    const provider = createAnthropicProvider({
      apiKey: SECRET_KEY,
      fetchFn: (async () =>
        sseResponse([
          'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":9}}}\n\n',
          'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hal"}}\n\n',
          'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"lo!"}}\n\n',
          'data: {"type":"message_delta","usage":{"output_tokens":2}}\n\n',
          'data: {"type":"message_stop"}\n\n',
        ])) as typeof fetch,
    });
    const deltas: string[] = [];
    const result = await provider.completeStream({ messages: [{ role: 'user', content: 'Hi' }] }, (d) => deltas.push(d));
    expect(deltas).toEqual(['Hal', 'lo!']);
    expect(result.text).toBe('Hallo!');
    expect(result.inputTokens).toBe(9);
    expect(result.outputTokens).toBe(2);
  });

  it('parses openai-compatible SSE deltas until [DONE]', async () => {
    const provider = createOpenAiCompatibleProvider({
      apiKey: SECRET_KEY,
      fetchFn: (async () =>
        sseResponse([
          'data: {"choices":[{"delta":{"content":"Mo"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"in"}}]}\n\n',
          'data: [DONE]\n\n',
        ])) as typeof fetch,
    });
    const deltas: string[] = [];
    const result = await provider.completeStream({ messages: [{ role: 'user', content: 'Hi' }] }, (d) => deltas.push(d));
    expect(deltas.join('')).toBe('Moin');
    expect(result.text).toBe('Moin');
  });

  it('mock streams chunks and can be aborted', async () => {
    const provider = createMockProvider();
    const controller = new AbortController();
    const deltas: string[] = [];
    const promise = provider.completeStream(
      { messages: [{ role: 'user', content: 'Hi' }] },
      (d) => {
        deltas.push(d);
        if (deltas.length === 3) controller.abort();
      },
      controller.signal,
    );
    const result = await promise;
    expect(deltas.length).toBeGreaterThanOrEqual(3);
    expect(result.text.length).toBeLessThan(200); // abgebrochen, nicht der volle Text
  });
});

describe('prompt builders', () => {
  it('embeds goal, tree and JSON contract into the plan prompt', () => {
    const { system, user } = buildAgentPlanPrompt('Baue ein Quest-System', 'src/\n  main.luau', [
      { path: 'src/main.luau', content: 'print("hi")' },
    ]);
    expect(user).toContain('Baue ein Quest-System');
    expect(user).toContain('main.luau');
    expect(user).toContain('"changes"');
    expect(system).toContain('Freigabe');
  });
});
