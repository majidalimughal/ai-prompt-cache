import { describe, it, expect } from 'vitest';
import { generateCacheKey, buildCanonicalPayload } from '../src/utils/cache-key-generator.js';
import type { ChatRequest } from '../src/types/chat.types.js';

const baseRequest: ChatRequest = {
  model: 'gpt-4.1',
  messages: [{ role: 'user', content: 'Explain Redis' }],
  temperature: 0.7,
};

describe('cache-key-generator', () => {
  it('generates deterministic keys', () => {
    const key1 = generateCacheKey({ provider: 'openai', request: baseRequest });
    const key2 = generateCacheKey({ provider: 'openai', request: baseRequest });
    expect(key1).toBe(key2);
    expect(key1).toMatch(/^apc:v1:[a-f0-9]{64}$/);
  });

  it('produces same key for equivalent prompts with different whitespace', () => {
    const req1: ChatRequest = {
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: '  Explain   Redis  ' }],
    };
    const req2: ChatRequest = {
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: 'Explain Redis' }],
    };

    const key1 = generateCacheKey({ provider: 'openai', request: req1 });
    const key2 = generateCacheKey({ provider: 'openai', request: req2 });
    expect(key1).toBe(key2);
  });

  it('produces different keys for different models', () => {
    const key1 = generateCacheKey({ provider: 'openai', request: baseRequest });
    const key2 = generateCacheKey({
      provider: 'openai',
      request: { ...baseRequest, model: 'gpt-4o' },
    });
    expect(key1).not.toBe(key2);
  });

  it('produces different keys for different providers', () => {
    const key1 = generateCacheKey({ provider: 'openai', request: baseRequest });
    const key2 = generateCacheKey({ provider: 'anthropic', request: baseRequest });
    expect(key1).not.toBe(key2);
  });

  it('includes tools and temperature in canonical payload', () => {
    const payload = buildCanonicalPayload({
      provider: 'openai',
      request: {
        ...baseRequest,
        tools: [{ type: 'function', function: { name: 'search', description: 'Search' } }],
      },
    });
    expect(payload.tools).toBeDefined();
    expect(payload.temperature).toBe(0.7);
  });

  it('respects custom key prefix', () => {
    const key = generateCacheKey({
      provider: 'openai',
      request: baseRequest,
      keyPrefix: 'custom',
    });
    expect(key).toMatch(/^custom:[a-f0-9]{64}$/);
  });
});
