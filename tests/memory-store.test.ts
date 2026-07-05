import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryStore } from '../src/cache/memory-store.js';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore({ ttl: 3600 });
  });

  afterEach(() => {
    store.destroy();
  });

  const sampleEntry = {
    key: 'test-key',
    response: {
      id: 'resp-1',
      model: 'gpt-4.1',
      content: 'cached response',
      role: 'assistant' as const,
      finish_reason: 'stop',
    },
    createdAt: Date.now(),
    expiresAt: null,
    provider: 'openai',
    model: 'gpt-4.1',
  };

  it('stores and retrieves entries', async () => {
    await store.set('key1', sampleEntry);
    const result = await store.get('key1');
    expect(result?.response.content).toBe('cached response');
  });

  it('returns null for missing keys', async () => {
    expect(await store.get('missing')).toBeNull();
  });

  it('expires entries after TTL', async () => {
    vi.useFakeTimers();
    const shortTtlStore = new MemoryStore({ ttl: 1 });
    await shortTtlStore.set('key1', sampleEntry, 1);

    vi.advanceTimersByTime(2000);
    expect(await shortTtlStore.get('key1')).toBeNull();
    shortTtlStore.destroy();
    vi.useRealTimers();
  });

  it('deletes by key', async () => {
    await store.set('key1', sampleEntry);
    expect(await store.delete('key1')).toBe(true);
    expect(await store.get('key1')).toBeNull();
  });

  it('deletes by prefix', async () => {
    await store.set('prefix:a', sampleEntry);
    await store.set('prefix:b', sampleEntry);
    await store.set('other:c', sampleEntry);

    const deleted = await store.deleteByPrefix('prefix');
    expect(deleted).toBe(2);
    expect(await store.get('other:c')).not.toBeNull();
  });

  it('clears all entries', async () => {
    await store.set('key1', sampleEntry);
    await store.clear();
    expect(await store.get('key1')).toBeNull();
  });

  it('reports health', async () => {
    const health = await store.health();
    expect(health.healthy).toBe(true);
    expect(health.cache).toBe(true);
  });
});
