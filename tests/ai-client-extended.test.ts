import { describe, it, expect, vi } from 'vitest';
import { AIClient } from '../src/ai-client.js';
import { MemoryStore } from '../src/cache/memory-store.js';
import { ProviderError } from '../src/errors/provider.error.js';
import type { LLMProvider } from '../src/providers/provider.interface.js';
import type { ChatRequest, ChatResponse } from '../src/types/chat.types.js';
import type { HealthStatus } from '../src/types/cache.types.js';

function createFailingProvider(): LLMProvider {
  return {
    name: 'failing',
    capabilities: { streaming: true, tools: true, functions: true },
    chat: async () => {
      throw new ProviderError('Provider failed', 'failing', { statusCode: 500 });
    },
    chatStream: async function* () {
      throw new ProviderError('Stream failed', 'failing');
      yield { id: '1', model: 'gpt', delta: '', finish_reason: null, done: false };
    },
    health: async (): Promise<HealthStatus> => ({
      healthy: false,
      cache: true,
      provider: false,
    }),
  };
}

function createMockProvider(): LLMProvider {
  return {
    name: 'mock',
    capabilities: { streaming: true, tools: true, functions: true },
    chat: async (request): Promise<ChatResponse> => ({
      id: '1',
      model: request.model,
      content: 'response',
      role: 'assistant',
      finish_reason: 'stop',
      usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
    }),
    chatStream: async function* (request) {
      yield {
        id: '1',
        model: request.model,
        delta: 'streamed',
        finish_reason: 'stop',
        done: true,
      };
    },
    health: async () => ({ healthy: true, cache: true, provider: true }),
  };
}

describe('AIClient extended', () => {
  it('emits error event on provider failure', async () => {
    const onError = vi.fn();
    const client = new AIClient({
      provider: createFailingProvider(),
      cache: new MemoryStore(),
      on: { error: onError },
    });

    await expect(
      client.chat({ model: 'gpt-4.1', messages: [{ role: 'user', content: 'fail' }] }),
    ).rejects.toThrow('Provider failed');

    expect(onError).toHaveBeenCalled();
  });

  it('invalidates by key', async () => {
    const client = new AIClient({
      provider: createMockProvider(),
      cache: new MemoryStore(),
    });

    await client.chat({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: 'key invalidation' }],
    });

    const result = await client.invalidate({ key: 'nonexistent' });
    expect(result).toBe(0);
  });

  it('registers and removes event handlers', () => {
    const client = new AIClient({
      provider: createMockProvider(),
      cache: new MemoryStore(),
    });

    const handler = vi.fn();
    client.on('cacheMiss', handler);
    client.off('cacheMiss', handler);
    expect(handler).not.toHaveBeenCalled();
  });

  it('reports unhealthy when provider is down', async () => {
    const client = new AIClient({
      provider: createFailingProvider(),
      cache: new MemoryStore(),
    });

    const health = await client.health();
    expect(health.healthy).toBe(false);
  });
});
