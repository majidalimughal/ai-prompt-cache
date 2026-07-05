import { describe, it, expect } from 'vitest';
import { createAI } from '../src/create-ai.js';
import { MemoryStore } from '../src/cache/memory-store.js';
import { ConfigurationError } from '../src/errors/configuration.error.js';
import type { LLMProvider } from '../src/providers/provider.interface.js';

describe('createAI validation', () => {
  it('throws when provider is missing', () => {
    expect(() =>
      createAI({ provider: undefined as unknown as LLMProvider, cache: new MemoryStore() }),
    ).toThrow(ConfigurationError);
  });

  it('throws when cache is missing', () => {
    expect(() =>
      createAI({
        provider: {
          name: 'x',
          capabilities: { streaming: true, tools: true, functions: true },
          chat: async () => ({
            id: '1',
            model: 'm',
            content: 'c',
            role: 'assistant',
            finish_reason: 'stop',
          }),
          chatStream: async function* () {},
          health: async () => ({ healthy: true, cache: true, provider: true }),
        },
        cache: undefined as unknown as MemoryStore,
      }),
    ).toThrow(ConfigurationError);
  });
});
