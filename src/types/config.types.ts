import type { CacheStore } from '../cache/cache-store.interface.js';
import type { LLMProvider } from '../providers/provider.interface.js';
import type { AIEvents } from './events.types.js';
import type { Logger } from './logger.types.js';
import type { Middleware } from './middleware.types.js';
import type { TTLValue } from './cache.types.js';

export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

export interface TimeoutConfig {
  requestTimeoutMs?: number;
  cacheLookupTimeoutMs?: number;
}

export interface LoggerConfig {
  enabled?: boolean;
  logger?: Logger;
}

export interface CreateAIOptions {
  provider: LLMProvider;
  cache: CacheStore;
  ttl?: TTLValue;
  retry?: RetryConfig;
  timeout?: TimeoutConfig;
  logger?: Logger | LoggerConfig | 'console' | 'disabled';
  middleware?: Middleware[];
  on?: Partial<{
    [K in keyof AIEvents]: (payload: AIEvents[K]) => void;
  }>;
  keyPrefix?: string;
}
