/**
 * AI provider abstraction.
 *
 * The whole app works WITHOUT an API key: every feature has a deterministic
 * engine (templates + heuristics) as its baseline. When the user stores an
 * Anthropic API key, generators upgrade to LLM-refined output through this
 * interface. That keeps the app honest - no fake buttons, no hard dependency
 * on external services.
 */

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCompletionRequest {
  system?: string;
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Ask the model to answer with a single JSON object. */
  jsonMode?: boolean;
}

export interface AiCompletionResult {
  text: string;
  /** Provider that produced this result ("mock" | "anthropic"). */
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface AiProviderStatus {
  provider: string;
  configured: boolean;
  model: string;
  detail: string;
}

export interface AiProvider {
  readonly name: string;
  status(): Promise<AiProviderStatus>;
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | 'not_configured'
      | 'auth'
      | 'rate_limit'
      | 'network'
      | 'invalid_response'
      | 'unknown',
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}
