import type { ChatRequest, ChatResponse, StreamChunk } from '../types/chat.types.js';
import type { HealthStatus } from '../types/cache.types.js';
import type { ProviderCapabilities } from '../types/provider.types.js';

export interface LLMProvider {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  chat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse>;
  chatStream(request: ChatRequest, signal?: AbortSignal): AsyncIterable<StreamChunk>;
  health(): Promise<HealthStatus>;
}
