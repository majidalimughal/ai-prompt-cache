import { describe, it, expect } from 'vitest';
import { CacheManager } from '../src/cache/cache-manager.js';
import { MemoryStore } from '../src/cache/memory-store.js';

describe('CacheManager extended', () => {
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

  it('supports delete, clear, has, and health', async () => {
    const manager = new CacheManager(new MemoryStore());
    await manager.set('k', entry);

    expect(await manager.has('k')).toBe(true);
    expect(await manager.delete('k')).toBe(true);
    expect(await manager.has('k')).toBe(false);

    await manager.set('prefix:a', entry);
    expect(await manager.deleteByPrefix('prefix')).toBe(1);

    await manager.set('x', entry);
    await manager.clear();
    expect(await manager.has('x')).toBe(false);

    const health = await manager.health();
    expect(health.healthy).toBe(true);
    expect(manager.underlying).toBeDefined();
  });
});
