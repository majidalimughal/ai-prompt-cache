import { describe, it, expect } from 'vitest';
import { StreamBuffer } from '../src/utils/stream-buffer.js';
import type { StreamChunk } from '../src/types/chat.types.js';

describe('StreamBuffer', () => {
  it('buffers and replays stream chunks', async () => {
    const chunks: StreamChunk[] = [
      { id: '1', model: 'gpt-4.1', delta: 'Hello', finish_reason: null, done: false },
      { id: '1', model: 'gpt-4.1', delta: ' world', finish_reason: 'stop', done: true },
    ];

    async function* source(): AsyncGenerator<StreamChunk> {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    const cached = await StreamBuffer.collect(source(), { model: 'gpt-4.1' });
    expect(cached.response.content).toBe('Hello world');
    expect(cached.chunks).toHaveLength(2);

    const replayed: StreamChunk[] = [];
    for await (const chunk of StreamBuffer.replay(cached)) {
      replayed.push(chunk);
    }
    expect(replayed).toEqual(chunks);
  });
});
