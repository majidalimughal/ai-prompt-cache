import { describe, it, expect } from 'vitest';
import { createAI, MemoryStore } from '../src/index.js';
import type { LLMProvider } from '../src/providers/provider.interface.js';

describe('logger config', () => {
  const provider: LLMProvider = {
    name: 'mock',
    capabilities: { streaming: true, tools: true, functions: true },
    chat: async () => ({
      id: '1',
      model: 'gpt',
      content: 'ok',
      role: 'assistant',
      finish_reason: 'stop',
    }),
    chatStream: async function* () {
      yield { id: '1', model: 'gpt', delta: 'x', finish_reason: 'stop', done: true };
    },
    health: async () => ({ healthy: true, cache: true, provider: true }),
  };

  it('uses LoggerConfig with custom logger', async () => {
    const customLogger = {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    };

    const ai = createAI({
      provider,
      cache: new MemoryStore(),
      logger: { enabled: true, logger: customLogger },
    });

    await ai.chat({ model: 'gpt', messages: [{ role: 'user', content: 'logger config test' }] });
    expect(ai.stats().totalRequests).toBe(1);
  });

  it('disables logging via LoggerConfig', async () => {
    const ai = createAI({
      provider,
      cache: new MemoryStore(),
      logger: { enabled: false },
    });

    await ai.chat({ model: 'gpt', messages: [{ role: 'user', content: 'disabled logger' }] });
    expect(ai.stats().misses).toBe(1);
  });
});
