import { describe, it, expect, vi } from 'vitest';
import { AIClient } from '../src/ai-client.js';
import { MemoryStore } from '../src/cache/memory-store.js';
import { ProviderError } from '../src/errors/provider.error.js';
import type { LLMProvider } from '../src/providers/provider.interface.js';
import type { ChatResponse } from '../src/types/chat.types.js';

describe('AIClient coverage gaps', () => {
  const provider: LLMProvider = {
    name: 'mock',
    capabilities: { streaming: true, tools: true, functions: true },
    chat: async () =>
      ({
        id: '1',
        model: 'gpt',
        content: 'ok',
        role: 'assistant',
        finish_reason: 'stop',
      }) as ChatResponse,
    chatStream: async function* () {
      throw new ProviderError('stream fail', 'mock');
      yield { id: '1', model: 'gpt', delta: '', finish_reason: null, done: false };
    },
    health: async () => ({ healthy: true, cache: true, provider: true }),
  };

  it('propagates chatStream errors during consumption', async () => {
    const client = new AIClient({
      provider,
      cache: new MemoryStore(),
    });

    const stream = await client.chatStream({
      model: 'gpt',
      messages: [{ role: 'user', content: 'x' }],
    });

    await expect(async () => {
      for await (const _chunk of stream) {
        // consume stream
      }
    }).rejects.toThrow('stream fail');
  });

  it('deletes cache by key', async () => {
    const client = new AIClient({ provider, cache: new MemoryStore() });
    expect(await client.deleteCache('missing')).toBe(false);
  });

  it('invalidates by prefix', async () => {
    const client = new AIClient({ provider, cache: new MemoryStore() });
    const result = await client.invalidate({ prefix: 'apc' });
    expect(result).toBe(0);
  });
});
