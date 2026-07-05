import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisStore } from '../src/cache/redis-store.js';

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

describe('RedisStore', () => {
  let store: RedisStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new RedisStore({ host: 'localhost', port: 6379, keyPrefix: 'test' });
  });

  const sampleEntry = {
    key: 'test-key',
    response: {
      id: 'resp-1',
      model: 'gpt-4.1',
      content: 'cached',
      role: 'assistant' as const,
      finish_reason: 'stop',
    },
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600_000,
    provider: 'openai',
    model: 'gpt-4.1',
  };

  it('gets cached entries', async () => {
    mockClient.get.mockResolvedValue(JSON.stringify(sampleEntry));
    const result = await store.get('key1');
    expect(result?.response.content).toBe('cached');
    expect(mockClient.get).toHaveBeenCalledWith('test:key1');
  });

  it('returns null for missing keys', async () => {
    mockClient.get.mockResolvedValue(null);
    expect(await store.get('missing')).toBeNull();
  });

  it('sets entries with TTL', async () => {
    await store.set('key1', sampleEntry, 3600);
    expect(mockClient.set).toHaveBeenCalledWith('test:key1', expect.any(String), 'EX', 3600);
  });

  it('deletes keys', async () => {
    mockClient.del.mockResolvedValue(1);
    expect(await store.delete('key1')).toBe(true);
  });

  it('deletes by prefix', async () => {
    mockClient.keys.mockResolvedValue(['test:prefix:a', 'test:prefix:b']);
    mockClient.del.mockResolvedValue(2);
    expect(await store.deleteByPrefix('prefix')).toBe(2);
  });

  it('reports healthy status on ping', async () => {
    mockClient.ping.mockResolvedValue('PONG');
    const health = await store.health();
    expect(health.healthy).toBe(true);
  });

  it('reports unhealthy on ping failure', async () => {
    mockClient.ping.mockRejectedValue(new Error('connection refused'));
    const health = await store.health();
    expect(health.healthy).toBe(false);
  });
});

describe('RedisStore without ioredis', () => {
  it('throws ConfigurationError when ioredis import fails', async () => {
    vi.doUnmock('ioredis');
    vi.resetModules();

    vi.doMock('ioredis', () => {
      throw new Error('Cannot find module');
    });

    const { RedisStore: FreshRedisStore } = await import('../src/cache/redis-store.js');
    const store = new FreshRedisStore();

    await expect(store.get('key')).rejects.toThrow(/ioredis is required/);
  });
});
