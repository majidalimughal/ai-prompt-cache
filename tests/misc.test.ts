import { describe, it, expect } from 'vitest';
import { createMemoryStore } from '../src/cache/memory-store.js';
import { resolveRetryOptions } from '../src/utils/retry.js';
import { extractSystemPrompt } from '../src/utils/cache-key-generator.js';

describe('misc coverage', () => {
  it('creates memory store via factory', () => {
    const store = createMemoryStore({ ttl: 60 });
    expect(store.name).toBe('memory');
    store.destroy();
  });

  it('resolves retry options with defaults', () => {
    const options = resolveRetryOptions({ maxRetries: 5 });
    expect(options.maxRetries).toBe(5);
    expect(options.initialDelayMs).toBe(500);
  });

  it('extracts system prompt from messages', () => {
    const prompt = extractSystemPrompt([
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hi' },
    ]);
    expect(prompt).toBe('You are helpful');
  });

  it('returns null when no system messages', () => {
    expect(extractSystemPrompt([{ role: 'user', content: 'Hi' }])).toBeNull();
  });
});
