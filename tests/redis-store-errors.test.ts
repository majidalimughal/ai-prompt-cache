import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisStore } from '../src/cache/redis-store.js';
import { CacheError } from '../src/errors/cache.error.js';

const mockClient = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  flushdb: vi.fn(),
  ping: vi.fn(),
  quit: vi.fn(),
};

vi.mock('ioredis', () => ({
  default: vi.fn(() => mockClient),
}));

describe('RedisStore errors', () => {
  let store: RedisStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new RedisStore({ keyPrefix: 'err' });
  });

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
    expiresAt: Date.now() + 1000,
    provider: 'openai',
    model: 'gpt',
  };

  it('throws CacheError on get failure', async () => {
    mockClient.get.mockRejectedValue(new Error('redis down'));
    await expect(store.get('k')).rejects.toThrow(CacheError);
  });

  it('throws CacheError on set failure', async () => {
    mockClient.set.mockRejectedValue(new Error('redis down'));
    await expect(store.set('k', entry)).rejects.toThrow(CacheError);
  });

  it('throws CacheError on delete failure', async () => {
    mockClient.del.mockRejectedValue(new Error('redis down'));
    await expect(store.delete('k')).rejects.toThrow(CacheError);
  });

  it('throws CacheError on deleteByPrefix failure', async () => {
    mockClient.keys.mockRejectedValue(new Error('redis down'));
    await expect(store.deleteByPrefix('p')).rejects.toThrow(CacheError);
  });

  it('throws CacheError on clear failure', async () => {
    mockClient.keys.mockRejectedValue(new Error('redis down'));
    await expect(store.clear()).rejects.toThrow(CacheError);
  });

  it('disconnects client', async () => {
    mockClient.ping.mockResolvedValue('PONG');
    await store.health();
    await store.disconnect();
    expect(mockClient.quit).toHaveBeenCalled();
  });
});
