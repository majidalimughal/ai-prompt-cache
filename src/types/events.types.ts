import type { ChatRequest, ChatResponse } from './chat.types.js';
import type { CacheEntry } from './cache.types.js';

export interface CacheHitEvent {
  cacheKey: string;
  request: ChatRequest;
  entry: CacheEntry;
  durationMs: number;
}

export interface CacheMissEvent {
  cacheKey: string;
  request: ChatRequest;
  durationMs: number;
}

export interface CacheWriteEvent {
  cacheKey: string;
  request: ChatRequest;
  response: ChatResponse;
  ttlSeconds: number | null;
}

export interface ProviderCallEvent {
  cacheKey: string;
  request: ChatRequest;
  durationMs: number;
}

export interface ErrorEvent {
  error: Error;
  cacheKey?: string;
  request?: ChatRequest;
  phase: 'cache' | 'provider' | 'pipeline' | 'configuration';
}

export interface AIEvents {
  cacheHit: CacheHitEvent;
  cacheMiss: CacheMissEvent;
  cacheWrite: CacheWriteEvent;
  providerCall: ProviderCallEvent;
  error: ErrorEvent;
}

export type AIEventName = keyof AIEvents;
