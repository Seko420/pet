/**
 * Minimal Server-Sent-Events reader for streaming AI responses.
 * Yields the string after each "data: " line; callers parse provider JSON.
 */
export async function* sseDataLines(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string, void, undefined> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        if (line.startsWith('data:')) {
          yield line.slice(5).trimStart();
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
