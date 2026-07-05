import type { CacheEntry } from '../types/cache.types.js';
import type { CacheStore } from './cache-store.interface.js';
import { CacheError } from '../errors/cache.error.js';

export class CacheManager {
  constructor(private readonly store: CacheStore) {}

  get storeName(): string {
    return this.store.name;
  }

  async get(key: string): Promise<{ entry: CacheEntry | null; lookupTimeMs: number }> {
    const start = performance.now();

    try {
      const entry = await this.store.get(key);
      return {
        entry,
        lookupTimeMs: performance.now() - start,
      };
    } catch (error) {
      throw new CacheError(
        `Cache lookup failed for key "${key}"`,
        this.store.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async set(key: string, entry: CacheEntry, ttlSeconds?: number | null): Promise<void> {
    try {
      await this.store.set(key, entry, ttlSeconds);
    } catch (error) {
      if (error instanceof CacheError) {
        throw error;
      }
      throw new CacheError(
        `Cache write failed for key "${key}"`,
        this.store.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    return this.store.deleteByPrefix(prefix);
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async health() {
    return this.store.health();
  }

  get underlying(): CacheStore {
    return this.store;
  }
}
