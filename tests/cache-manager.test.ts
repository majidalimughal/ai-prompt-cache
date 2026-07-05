import { describe, it, expect } from 'vitest';
import { CacheManager } from '../src/cache/cache-manager.js';
import { MemoryStore } from '../src/cache/memory-store.js';
import { CacheError } from '../src/errors/cache.error.js';

describe('CacheManager', () => {
  it('wraps store with timing', async () => {
    const manager = new CacheManager(new MemoryStore());
    const entry = {
      key: 'k',
      response: {
        id: '1',
        model: 'gpt-4.1',
        content: 'test',
        role: 'assistant' as const,
        finish_reason: 'stop',
      },
      createdAt: Date.now(),
      expiresAt: null,
      provider: 'mock',
      model: 'gpt-4.1',
    };

    await manager.set('k', entry);
    const result = await manager.get('k');
    expect(result.entry?.response.content).toBe('test');
    expect(result.lookupTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('wraps store errors as CacheError', async () => {
    const failingStore = {
      name: 'failing',
      get: async () => {
        throw new Error('boom');
      },
      set: async () => undefined,
      delete: async () => false,
      deleteByPrefix: async () => 0,
      clear: async () => undefined,
      has: async () => false,
      health: async () => ({ healthy: false, cache: false, provider: true }),
    };

    const manager = new CacheManager(failingStore);
    await expect(manager.get('key')).rejects.toThrow(CacheError);
  });
});
