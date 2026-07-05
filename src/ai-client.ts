import type { ChatRequest, ChatResponse, StreamChunk } from './types/chat.types.js';
import type { CacheStats, HealthStatus, InvalidationOptions } from './types/cache.types.js';
import type { AIEvents, AIEventName } from './types/events.types.js';
import type { CreateAIOptions } from './types/config.types.js';
import {
  createPipelineDeps,
  RequestPipeline,
  type PipelineDependencies,
} from './pipeline/request-pipeline.js';

export class AIClient {
  private readonly pipeline: RequestPipeline;
  private readonly deps: PipelineDependencies;

  constructor(options: CreateAIOptions) {
    this.deps = createPipelineDeps(options);
    this.pipeline = new RequestPipeline(this.deps);
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      return await this.pipeline.chat(request);
    } catch (error) {
      this.emitError(error, request);
      throw error;
    }
  }

  async chatStream(request: ChatRequest): Promise<AsyncIterable<StreamChunk>> {
    try {
      return await this.pipeline.chatStream(request);
    } catch (error) {
      this.emitError(error, request);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    await this.deps.cache.clear();
  }

  async deleteCache(key: string): Promise<boolean> {
    return this.deps.cache.delete(key);
  }

  async invalidate(options?: InvalidationOptions): Promise<number | undefined> {
    if (options?.key) {
      const deleted = await this.deps.cache.delete(options.key);
      return deleted ? 1 : 0;
    }

    if (options?.prefix) {
      return this.deps.cache.deleteByPrefix(options.prefix);
    }

    await this.deps.cache.clear();
    return undefined;
  }

  stats(): CacheStats {
    return this.deps.stats.getStats();
  }

  async health(): Promise<HealthStatus> {
    const [cacheHealth, providerHealth] = await Promise.all([
      this.deps.cache.health(),
      this.deps.provider.health(),
    ]);

    return {
      healthy: cacheHealth.healthy && providerHealth.provider,
      cache: cacheHealth.cache,
      provider: providerHealth.provider,
      details: {
        cache: cacheHealth.details,
        provider: providerHealth.details,
        metrics: this.deps.metrics.getSnapshot(),
      },
    };
  }

  on<K extends AIEventName>(event: K, handler: (payload: AIEvents[K]) => void): void {
    this.deps.events.on(event, handler);
  }

  off<K extends AIEventName>(event: K, handler: (payload: AIEvents[K]) => void): void {
    this.deps.events.off(event, handler);
  }

  private emitError(error: unknown, request?: ChatRequest): void {
    const err = error instanceof Error ? error : new Error(String(error));

    this.deps.events.emit('error', {
      error: err,
      request,
      phase: 'pipeline',
    });

    this.deps.logger.error(err.message, { request });
  }
}
