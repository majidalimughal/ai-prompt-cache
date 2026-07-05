import type { CacheEntry, HealthStatus } from '../types/cache.types.js';
import type { CacheStore, CacheStoreOptions } from './cache-store.interface.js';
import { CacheError } from '../errors/cache.error.js';
import { ConfigurationError } from '../errors/configuration.error.js';
import { computeExpiresAt, isExpired, parseTTL } from '../utils/ttl-parser.js';
import { DEFAULT_TTL_SECONDS } from '../config/defaults.js';

export interface RedisStoreOptions extends CacheStoreOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  tls?: boolean;
}

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: string, ttl: number): Promise<unknown>;
  set(key: string, value: string): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<string>;
  ping(): Promise<string>;
  quit(): Promise<string>;
}

export class RedisStore implements CacheStore {
  public readonly name = 'redis';
  private client: RedisClient | null = null;
  private readonly options: Required<
    Pick<RedisStoreOptions, 'host' | 'port' | 'db' | 'keyPrefix'>
  > &
    RedisStoreOptions;
  private readonly defaultTtlSeconds: number | null;
  private initPromise: Promise<RedisClient> | null = null;

  constructor(options: RedisStoreOptions = {}) {
    this.options = {
      host: options.host ?? '127.0.0.1',
      port: options.port ?? 6379,
      db: options.db ?? 0,
      keyPrefix: options.keyPrefix ?? 'apc',
      ...options,
    };
    this.defaultTtlSeconds = parseTTL(options.ttl ?? DEFAULT_TTL_SECONDS);
  }

  async get(key: string): Promise<CacheEntry | null> {
    const client = await this.getClient();
    const fullKey = this.resolveKey(key);

    try {
      const raw = await client.get(fullKey);
      if (!raw) {
        return null;
      }

      const entry = JSON.parse(raw) as CacheEntry;

      if (isExpired(entry.expiresAt)) {
        await client.del(fullKey);
        return null;
      }

      return entry;
    } catch (error) {
      throw new CacheError(
        `Failed to get cache key "${key}"`,
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async set(key: string, entry: CacheEntry, ttlSeconds?: number | null): Promise<void> {
    const client = await this.getClient();
    const fullKey = this.resolveKey(key);
    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlSeconds;
    const expiresAt = computeExpiresAt(ttl);
    const payload: CacheEntry = { ...entry, key: fullKey, expiresAt };

    try {
      const serialized = JSON.stringify(payload);

      if (ttl !== null && ttl > 0) {
        await client.set(fullKey, serialized, 'EX', ttl);
      } else {
        await client.set(fullKey, serialized);
      }
    } catch (error) {
      throw new CacheError(
        `Failed to set cache key "${key}"`,
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async delete(key: string): Promise<boolean> {
    const client = await this.getClient();
    const fullKey = this.resolveKey(key);

    try {
      const deleted = await client.del(fullKey);
      return deleted > 0;
    } catch (error) {
      throw new CacheError(
        `Failed to delete cache key "${key}"`,
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    const client = await this.getClient();
    const pattern = `${this.resolveKey(prefix)}*`;

    try {
      const keys = await client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await client.del(...keys);
    } catch (error) {
      throw new CacheError(
        `Failed to delete keys by prefix "${prefix}"`,
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async clear(): Promise<void> {
    const client = await this.getClient();

    try {
      const keys = await client.keys(`${this.options.keyPrefix}:*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      throw new CacheError(
        'Failed to clear cache',
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async has(key: string): Promise<boolean> {
    const entry = await this.get(key);
    return entry !== null;
  }

  async health(): Promise<HealthStatus> {
    try {
      const client = await this.getClient();
      const pong = await client.ping();
      return {
        healthy: pong === 'PONG',
        cache: pong === 'PONG',
        provider: true,
        details: { store: this.name, host: this.options.host, port: this.options.port },
      };
    } catch (error) {
      return {
        healthy: false,
        cache: false,
        provider: true,
        details: {
          store: this.name,
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.initPromise = null;
    }
  }

  private resolveKey(key: string): string {
    return `${this.options.keyPrefix}:${key}`;
  }

  private async getClient(): Promise<RedisClient> {
    if (this.client) {
      return this.client;
    }

    if (!this.initPromise) {
      this.initPromise = this.initializeClient();
    }

    this.client = await this.initPromise;
    return this.client;
  }

  private async initializeClient(): Promise<RedisClient> {
    try {
      const module = await import('ioredis');
      const Client = module.default;
      const client = new Client({
        host: this.options.host,
        port: this.options.port,
        password: this.options.password,
        db: this.options.db,
        tls: this.options.tls ? {} : undefined,
        lazyConnect: false,
        maxRetriesPerRequest: 3,
      });

      return client;
    } catch {
      throw new ConfigurationError(
        'ioredis is required for RedisStore. Install it with: pnpm add ioredis',
        'cache',
      );
    }
  }
}
