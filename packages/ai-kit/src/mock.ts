import type { AiCompletionRequest, AiCompletionResult, AiProvider, AiProviderStatus } from './provider';

/**
 * Deterministic offline provider. It never fakes real AI output - answers
 * are honest about being mock content so the UI can rely on features
 * working without pretending intelligence that is not there.
 */
export function createMockProvider(): AiProvider {
  return {
    name: 'mock',

    async status(): Promise<AiProviderStatus> {
      return {
        provider: 'mock',
        configured: false,
        model: 'mock',
        detail:
          'Mock-Modus – hinterlege einen Anthropic API-Key in den Einstellungen für echte KI-Antworten. Alle Generatoren funktionieren trotzdem über die eingebauten Heuristik-Engines.',
      };
    },

    async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
      return { text: buildMockText(request), provider: 'mock', model: 'mock', inputTokens: null, outputTokens: null };
    },

    // Chunked mock streaming so the chat UI (deltas, stop button) can be
    // exercised completely offline.
    async completeStream(request, onDelta, signal): Promise<AiCompletionResult> {
      const text = buildMockText(request);
      const words = text.split(/(\s+)/);
      let sent = '';
      for (const word of words) {
        if (signal?.aborted) break;
        sent += word;
        onDelta(word);
        await new Promise((resolve) => setTimeout(resolve, 8));
      }
      return { text: sent, provider: 'mock', model: 'mock', inputTokens: null, outputTokens: null };
    },
  };
}

function buildMockText(request: AiCompletionRequest): string {
  const lastUser = [...request.messages].reverse().find((m) => m.role === 'user');
  if (request.jsonMode) {
    return JSON.stringify({
      note: 'mock',
      hint: 'Mock-Modus aktiv – dieses JSON ist ein Platzhalter ohne inhaltliche Aussage.',
    });
  }
  return [
    'Hinweis: Die KI-Anbindung läuft im Mock-Modus (kein API-Key hinterlegt).',
    'Hinterlege in den Einstellungen einen KI-Schlüssel (Anthropic, OpenAI oder eine kostenlose lokale KI wie LM Studio), um echte Antworten zu erhalten.',
    lastUser
      ? `Deine Anfrage (${Math.min(lastUser.content.length, 9999)} Zeichen) wurde nicht an eine KI gesendet.`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}
