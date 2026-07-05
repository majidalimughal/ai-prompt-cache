import type { CacheEntry } from '../types/cache.types.js';
import type { CacheStore, CacheStoreOptions } from './cache-store.interface.js';
import { computeExpiresAt, isExpired, parseTTL } from '../utils/ttl-parser.js';
import { DEFAULT_TTL_SECONDS } from '../config/defaults.js';

interface MemoryEntry {
  entry: CacheEntry;
  expiresAt: number | null;
}

const SWEEP_INTERVAL_MS = 60_000;

export class MemoryStore implements CacheStore {
  public readonly name = 'memory';
  private readonly store = new Map<string, MemoryEntry>();
  private readonly defaultTtlSeconds: number | null;
  private readonly keyPrefix: string;
  private sweepTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: CacheStoreOptions = {}) {
    this.defaultTtlSeconds = parseTTL(options.ttl ?? DEFAULT_TTL_SECONDS);
    this.keyPrefix = options.keyPrefix ?? '';
    this.startSweepTimer();
  }

  get(key: string): Promise<CacheEntry | null> {
    const fullKey = this.resolveKey(key);
    const stored = this.store.get(fullKey);

    if (!stored) {
      return Promise.resolve(null);
    }

    if (isExpired(stored.expiresAt)) {
      this.store.delete(fullKey);
      return Promise.resolve(null);
    }

    return Promise.resolve(stored.entry);
  }

  set(key: string, entry: CacheEntry, ttlSeconds?: number | null): Promise<void> {
    const fullKey = this.resolveKey(key);
    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlSeconds;
    const expiresAt = computeExpiresAt(ttl);

    this.store.set(fullKey, {
      entry: { ...entry, key: fullKey, expiresAt },
      expiresAt,
    });
    return Promise.resolve();
  }

  delete(key: string): Promise<boolean> {
    return Promise.resolve(this.store.delete(this.resolveKey(key)));
  }

  deleteByPrefix(prefix: string): Promise<number> {
    const fullPrefix = this.resolveKey(prefix);
    let deleted = 0;

    for (const key of [...this.store.keys()]) {
      if (key.startsWith(fullPrefix)) {
        this.store.delete(key);
        deleted++;
      }
    }

    return Promise.resolve(deleted);
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
  }

  async has(key: string): Promise<boolean> {
    const entry = await this.get(key);
    return entry !== null;
  }

  health(): Promise<{
    healthy: boolean;
    cache: boolean;
    provider: boolean;
    details?: Record<string, unknown>;
  }> {
    return Promise.resolve({
      healthy: true,
      cache: true,
      provider: true,
      details: { entries: this.store.size, store: this.name },
    });
  }

  destroy(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  private resolveKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}:${key}` : key;
  }

  private startSweepTimer(): void {
    this.sweepTimer = setInterval(() => {
      this.sweepExpired();
    }, SWEEP_INTERVAL_MS);

    if (typeof this.sweepTimer === 'object' && 'unref' in this.sweepTimer) {
      this.sweepTimer.unref();
    }
  }

  private sweepExpired(): void {
    for (const [key, stored] of this.store.entries()) {
      if (isExpired(stored.expiresAt)) {
        this.store.delete(key);
      }
    }
  }
}

export function createMemoryStore(options?: CacheStoreOptions): MemoryStore {
  return new MemoryStore(options);
}
