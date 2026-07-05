import type { ChatRequest, ChatResponse, StreamChunk } from './chat.types.js';
import type { HealthStatus } from './cache.types.js';

export interface ProviderChatOptions {
  signal?: AbortSignal;
}

export interface ProviderCapabilities {
  streaming: boolean;
  tools: boolean;
  functions: boolean;
}

export interface ProviderRequestContext {
  request: ChatRequest;
  cacheKey: string;
  signal?: AbortSignal;
}

export interface ProviderResponseContext {
  request: ChatRequest;
  response: ChatResponse;
  cacheKey: string;
  durationMs: number;
}

export type ProviderStream = AsyncIterable<StreamChunk>;

export interface ProviderHealthCheck {
  status: HealthStatus;
  latencyMs?: number;
}
