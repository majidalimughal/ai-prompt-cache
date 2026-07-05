import type { CachedStreamData, ChatResponse } from './chat.types.js';

export type TTLValue = number | string | null;

export interface CacheEntry {
  key: string;
  response: ChatResponse;
  streamData?: CachedStreamData;
  createdAt: number;
  expiresAt: number | null;
  provider: string;
  model: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  writes: number;
  hitRatio: number;
  estimatedCostSavedUsd: number;
  estimatedTotalCostUsd: number;
  averageResponseTimeMs: number;
  averageCachedResponseTimeMs: number;
  averageProviderTimeMs: number;
  averageCacheLookupTimeMs: number;
  totalRequests: number;
}

export interface InvalidationOptions {
  prefix?: string;
  key?: string;
}

export interface HealthStatus {
  healthy: boolean;
  cache: boolean;
  provider: boolean;
  details?: Record<string, unknown>;
}
