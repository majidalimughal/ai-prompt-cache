import type { CacheEntry, TTLValue, HealthStatus } from '../types/cache.types.js';

export interface CacheStoreOptions {
  ttl?: TTLValue;
  keyPrefix?: string;
}

export interface CacheGetResult {
  entry: CacheEntry | null;
  lookupTimeMs: number;
}

export interface CacheStore {
  readonly name: string;

  get(key: string): Promise<CacheEntry | null>;
  set(key: string, entry: CacheEntry, ttlSeconds?: number | null): Promise<void>;
  delete(key: string): Promise<boolean>;
  deleteByPrefix(prefix: string): Promise<number>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  health(): Promise<HealthStatus>;
}
