import type { StreamChunk, CachedStreamData, ChatResponse } from '../types/chat.types.js';

export class StreamBuffer {
  private readonly chunks: StreamChunk[] = [];
  private aggregatedContent = '';

  add(chunk: StreamChunk): void {
    this.chunks.push(chunk);
    if (chunk.delta) {
      this.aggregatedContent += chunk.delta;
    }
  }

  getChunks(): StreamChunk[] {
    return [...this.chunks];
  }

  toCachedData(response: ChatResponse): CachedStreamData {
    return {
      chunks: this.getChunks(),
      response: {
        ...response,
        content: this.aggregatedContent || response.content,
      },
    };
  }

  static async collect(
    stream: AsyncIterable<StreamChunk>,
    baseResponse: Partial<ChatResponse>,
  ): Promise<CachedStreamData> {
    const buffer = new StreamBuffer();
    let lastChunk: StreamChunk | undefined;

    for await (const chunk of stream) {
      buffer.add(chunk);
      lastChunk = chunk;
    }

    const response: ChatResponse = {
      id: lastChunk?.id ?? baseResponse.id ?? 'stream-response',
      model: lastChunk?.model ?? baseResponse.model ?? 'unknown',
      content: buffer['aggregatedContent'] || null,
      role: lastChunk?.role ?? baseResponse.role ?? 'assistant',
      finish_reason: lastChunk?.finish_reason ?? 'stop',
      usage: lastChunk?.usage ?? baseResponse.usage,
      tool_calls: baseResponse.tool_calls,
      raw: baseResponse.raw,
    };

    return buffer.toCachedData(response);
  }

  static replay(cachedData: CachedStreamData): AsyncIterable<StreamChunk> {
    const chunks = [...cachedData.chunks];
    let index = 0;

    return {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<StreamChunk>> {
            if (index >= chunks.length) {
              return Promise.resolve({ done: true, value: undefined });
            }
            const value = chunks[index];
            index += 1;
            return Promise.resolve({ done: false, value });
          },
        };
      },
    };
  }
}
