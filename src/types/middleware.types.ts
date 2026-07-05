import type { ChatRequest, ChatResponse } from './chat.types.js';
import type { CacheEntry } from './cache.types.js';

export interface MiddlewareContext {
  cacheKey: string;
  request: ChatRequest;
  response?: ChatResponse;
  entry?: CacheEntry;
  fromCache: boolean;
  durationMs: number;
}

export interface Middleware {
  beforeRequest?(context: MiddlewareContext): Promise<void> | void;
  afterResponse?(context: MiddlewareContext): Promise<void> | void;
  onCacheHit?(context: MiddlewareContext): Promise<void> | void;
  onCacheMiss?(context: MiddlewareContext): Promise<void> | void;
}
