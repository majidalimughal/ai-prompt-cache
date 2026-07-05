import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAI } from '../src/create-ai.js';
import { MemoryStore } from '../src/cache/memory-store.js';
import { ConfigurationError } from '../src/errors/configuration.error.js';
import type { LLMProvider } from '../src/providers/provider.interface.js';
import type { ChatRequest, ChatResponse, StreamChunk } from '../src/types/chat.types.js';
import type { HealthStatus } from '../src/types/cache.types.js';

function createMockProvider(chatFn?: (request: ChatRequest) => Promise<ChatResponse>): LLMProvider {
  return {
    name: 'mock',
    capabilities: { streaming: true, tools: true, functions: true },
    chat:
      chatFn ??
      (async (request) => ({
        id: 'mock-1',
        model: request.model,
        content: 'mock response',
        role: 'assistant',
        finish_reason: 'stop',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })),
    chatStream: async function* (request): AsyncGenerator<StreamChunk> {
      yield {
        id: 'mock-1',
        model: request.model,
        delta: 'mock',
        finish_reason: 'stop',
        done: true,
      };
    },
    health: async (): Promise<HealthStatus> => ({
      healthy: true,
      cache: true,
      provider: true,
    }),
  };
}

describe('createAI', () => {
  it('throws when provider is missing', () => {
    expect(() =>
      createAI({ provider: undefined as unknown as LLMProvider, cache: new MemoryStore() }),
    ).toThrow(ConfigurationError);
  });

  it('throws when cache is missing', () => {
    expect(() =>
      createAI({
        provider: createMockProvider(),
        cache: undefined as unknown as MemoryStore,
      }),
    ).toThrow(ConfigurationError);
  });
});

describe('AIClient', () => {
  let chatMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    chatMock = vi.fn().mockResolvedValue({
      id: 'mock-1',
      model: 'gpt-4.1',
      content: 'mock response',
      role: 'assistant',
      finish_reason: 'stop',
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    });
  });

  it('returns cached response on cache hit', async () => {
    const provider = createMockProvider(chatMock);
    const ai = createAI({
      provider,
      cache: new MemoryStore({ ttl: 3600 }),
      logger: 'disabled',
    });

    const request: ChatRequest = {
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: 'Explain Redis' }],
    };

    await ai.chat(request);
    await ai.chat(request);

    expect(chatMock).toHaveBeenCalledTimes(1);

    const stats = ai.stats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRatio).toBe(0.5);
  });

  it('emits cache hit and miss events', async () => {
    const onCacheHit = vi.fn();
    const onCacheMiss = vi.fn();
    const onCacheWrite = vi.fn();

    const ai = createAI({
      provider: createMockProvider(chatMock),
      cache: new MemoryStore(),
      logger: 'disabled',
      on: {
        cacheHit: onCacheHit,
        cacheMiss: onCacheMiss,
        cacheWrite: onCacheWrite,
      },
    });

    const request: ChatRequest = {
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: 'test event' }],
    };

    await ai.chat(request);
    await ai.chat(request);

    expect(onCacheMiss).toHaveBeenCalledTimes(1);
    expect(onCacheWrite).toHaveBeenCalledTimes(1);
    expect(onCacheHit).toHaveBeenCalledTimes(1);
  });

  it('clears and invalidates cache', async () => {
    const ai = createAI({
      provider: createMockProvider(chatMock),
      cache: new MemoryStore(),
      logger: 'disabled',
    });

    const request: ChatRequest = {
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: 'invalidate test' }],
    };

    await ai.chat(request);
    await ai.clearCache();
    await ai.chat(request);

    expect(chatMock).toHaveBeenCalledTimes(2);
  });

  it('reports health status', async () => {
    const ai = createAI({
      provider: createMockProvider(),
      cache: new MemoryStore(),
    });

    const health = await ai.health();
    expect(health.healthy).toBe(true);
  });

  it('runs middleware hooks', async () => {
    const onCacheMiss = vi.fn();
    const afterResponse = vi.fn();

    const ai = createAI({
      provider: createMockProvider(chatMock),
      cache: new MemoryStore(),
      logger: 'disabled',
      middleware: [{ onCacheMiss, afterResponse }],
    });

    await ai.chat({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: 'middleware test' }],
    });

    expect(onCacheMiss).toHaveBeenCalled();
    expect(afterResponse).toHaveBeenCalled();
  });

  it('supports streaming with cache', async () => {
    const ai = createAI({
      provider: createMockProvider(),
      cache: new MemoryStore(),
      logger: 'disabled',
    });

    const request: ChatRequest = {
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: 'stream test' }],
    };

    const stream1 = await ai.chatStream(request);
    const chunks1 = [];
    for await (const chunk of stream1) {
      chunks1.push(chunk);
    }

    const stream2 = await ai.chatStream(request);
    const chunks2 = [];
    for await (const chunk of stream2) {
      chunks2.push(chunk);
    }

    expect(chunks1.length).toBeGreaterThan(0);
    expect(chunks2.length).toBe(chunks1.length);
  });
});
