import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryStore } from '../src/cache/memory-store.js';
import { CacheManager } from '../src/cache/cache-manager.js';
import { CacheError } from '../src/errors/cache.error.js';

describe('memory and cache manager gaps', () => {
  it('uses key prefix in memory store', async () => {
    const store = new MemoryStore({ keyPrefix: 'app', ttl: 3600 });
    const entry = {
      key: 'k',
      response: {
        id: '1',
        model: 'gpt',
        content: 'c',
        role: 'assistant' as const,
        finish_reason: 'stop',
      },
      createdAt: Date.now(),
      expiresAt: null,
      provider: 'mock',
      model: 'gpt',
    };

    await store.set('k', entry);
    expect(await store.get('k')).not.toBeNull();
    store.destroy();
  });

  it('sweeps expired entries on interval', async () => {
    vi.useFakeTimers();
    const store = new MemoryStore({ ttl: 1 });
    const entry = {
      key: 'k',
      response: {
        id: '1',
        model: 'gpt',
        content: 'c',
        role: 'assistant' as const,
        finish_reason: 'stop',
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + 500,
      provider: 'mock',
      model: 'gpt',
    };

    await store.set('k', entry, 1);
    vi.advanceTimersByTime(120_000);
    expect(await store.get('k')).toBeNull();
    store.destroy();
    vi.useRealTimers();
  });

  it('exposes store name and rethrows cache errors on set', async () => {
    const failingStore = {
      name: 'fail',
      get: async () => null,
      set: async () => {
        throw new Error('set failed');
      },
      delete: async () => false,
      deleteByPrefix: async () => 0,
      clear: async () => undefined,
      has: async () => false,
      health: async () => ({ healthy: false, cache: false, provider: true }),
    };

    const manager = new CacheManager(failingStore);
    expect(manager.storeName).toBe('fail');

    await expect(
      manager.set('k', {
        key: 'k',
        response: {
          id: '1',
          model: 'gpt',
          content: 'c',
          role: 'assistant',
          finish_reason: 'stop',
        },
        createdAt: Date.now(),
        expiresAt: null,
        provider: 'mock',
        model: 'gpt',
      }),
    ).rejects.toThrow(CacheError);
  });
});
