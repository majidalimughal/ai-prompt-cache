export { createAI } from './create-ai.js';
export { AIClient } from './ai-client.js';

export { MemoryStore, RedisStore, CacheManager } from './cache/index.js';
export type { CacheStore, CacheStoreOptions } from './cache/index.js';

export { OpenAIProvider } from './providers/index.js';
export type { LLMProvider } from './providers/index.js';

export {
  ProviderError,
  CacheError,
  TimeoutError,
  ConfigurationError,
  AIPromptCacheError,
} from './errors/index.js';

export type {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  MessageRole,
  ToolDefinition,
  FunctionDefinition,
  StreamChunk,
  CreateAIOptions,
  RetryConfig,
  TimeoutConfig,
  LoggerConfig,
  CacheEntry,
  CacheStats,
  TTLValue,
  InvalidationOptions,
  HealthStatus,
  Middleware,
  MiddlewareContext,
  AIEvents,
  Logger,
} from './types/index.js';
