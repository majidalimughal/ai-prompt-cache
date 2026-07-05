import type { ChatRequest, ChatResponse, StreamChunk } from '../types/chat.types.js';
import type { CacheEntry } from '../types/cache.types.js';
import type { CreateAIOptions } from '../types/config.types.js';
import type { Logger } from '../types/logger.types.js';
import type { LoggerInput } from '../utils/logger.js';
import type { MiddlewareContext } from '../types/middleware.types.js';
import type { LLMProvider } from '../providers/provider.interface.js';
import { CacheManager } from '../cache/cache-manager.js';
import { TypedEventEmitter } from '../events/event-emitter.js';
import { MiddlewareManager } from '../middleware/middleware-manager.js';
import { CostEstimator } from '../metrics/cost-estimator.js';
import { MetricsCollector } from '../metrics/metrics-collector.js';
import { StatsTracker } from '../metrics/stats-tracker.js';
import { generateCacheKey } from '../utils/cache-key-generator.js';
import { parseTTL } from '../utils/ttl-parser.js';
import { withRetry } from '../utils/retry.js';
import { withTimeout } from '../utils/timeout.js';
import { StreamBuffer } from '../utils/stream-buffer.js';
import { createLogger } from '../utils/logger.js';
import {
  DEFAULT_CACHE_LOOKUP_TIMEOUT_MS,
  DEFAULT_REQUEST_TIMEOUT_MS,
  DEFAULT_TTL_SECONDS,
} from '../config/defaults.js';
import { computeExpiresAt } from '../utils/ttl-parser.js';

export interface PipelineDependencies {
  provider: LLMProvider;
  cache: CacheManager;
  events: TypedEventEmitter;
  middleware: MiddlewareManager;
  stats: StatsTracker;
  metrics: MetricsCollector;
  logger: Logger;
  ttlSeconds: number | null;
  keyPrefix?: string;
  retry: CreateAIOptions['retry'];
  timeout: CreateAIOptions['timeout'];
}

export class RequestPipeline {
  constructor(private readonly deps: PipelineDependencies) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const start = performance.now();
    const cacheKey = this.buildCacheKey(request);

    const context: MiddlewareContext = {
      cacheKey,
      request,
      fromCache: false,
      durationMs: 0,
    };

    const { entry, lookupTimeMs } = await this.lookupCache(cacheKey);

    if (entry) {
      return this.handleCacheHit(entry, context, start, lookupTimeMs);
    }

    return this.handleCacheMiss(request, cacheKey, context, start, lookupTimeMs);
  }

  async chatStream(request: ChatRequest): Promise<AsyncIterable<StreamChunk>> {
    const start = performance.now();
    const cacheKey = this.buildCacheKey(request);

    const { entry, lookupTimeMs } = await this.lookupCache(cacheKey);

    if (entry?.streamData) {
      const durationMs = performance.now() - start;
      this.deps.stats.recordHit(request, entry.streamData.response, durationMs, lookupTimeMs);
      this.deps.events.emit('cacheHit', {
        cacheKey,
        request,
        entry,
        durationMs,
      });
      this.deps.logger.debug('Stream cache hit', { cacheKey, durationMs });
      return StreamBuffer.replay(entry.streamData);
    }

    return this.handleStreamMiss(request, cacheKey, start, lookupTimeMs);
  }

  private buildCacheKey(request: ChatRequest): string {
    return generateCacheKey({
      provider: this.deps.provider.name,
      request,
      keyPrefix: this.deps.keyPrefix,
    });
  }

  private async lookupCache(cacheKey: string): Promise<{
    entry: CacheEntry | null;
    lookupTimeMs: number;
  }> {
    const cacheLookupTimeout =
      this.deps.timeout?.cacheLookupTimeoutMs ?? DEFAULT_CACHE_LOOKUP_TIMEOUT_MS;

    return withTimeout(async () => this.deps.cache.get(cacheKey), cacheLookupTimeout, 'cache');
  }

  private async handleCacheHit(
    entry: CacheEntry,
    context: MiddlewareContext,
    start: number,
    lookupTimeMs: number,
  ): Promise<ChatResponse> {
    const durationMs = performance.now() - start;
    context.fromCache = true;
    context.entry = entry;
    context.response = entry.response;
    context.durationMs = durationMs;

    await this.deps.middleware.runOnCacheHit(context);
    this.deps.stats.recordHit(context.request, entry.response, durationMs, lookupTimeMs);
    this.deps.metrics.record({
      totalTimeMs: durationMs,
      cacheLookupTimeMs: lookupTimeMs,
      providerTimeMs: 0,
      executionTimeMs: durationMs,
    });

    this.deps.events.emit('cacheHit', {
      cacheKey: context.cacheKey,
      request: context.request,
      entry,
      durationMs,
    });

    this.deps.logger.debug('Cache hit', { cacheKey: context.cacheKey, durationMs });
    return entry.response;
  }

  private async handleCacheMiss(
    request: ChatRequest,
    cacheKey: string,
    context: MiddlewareContext,
    start: number,
    lookupTimeMs: number,
  ): Promise<ChatResponse> {
    const missDuration = performance.now() - start;

    await this.deps.middleware.runOnCacheMiss({
      ...context,
      durationMs: missDuration,
    });

    this.deps.stats.recordMiss(missDuration, lookupTimeMs);
    this.deps.events.emit('cacheMiss', {
      cacheKey,
      request,
      durationMs: missDuration,
    });

    const providerStart = performance.now();
    const requestTimeout = this.deps.timeout?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

    const response = await withRetry(
      () =>
        withTimeout(
          (signal) => this.deps.provider.chat(request, signal),
          requestTimeout,
          'request',
        ),
      this.deps.retry,
    );

    const providerTimeMs = performance.now() - providerStart;
    const totalDurationMs = performance.now() - start;

    this.deps.stats.recordProviderCall(providerTimeMs);
    this.deps.stats.recordWrite(request, response);
    this.deps.metrics.record({
      totalTimeMs: totalDurationMs,
      cacheLookupTimeMs: lookupTimeMs,
      providerTimeMs,
      executionTimeMs: totalDurationMs,
    });

    this.deps.events.emit('providerCall', {
      cacheKey,
      request,
      durationMs: providerTimeMs,
    });

    const entry: CacheEntry = {
      key: cacheKey,
      response,
      createdAt: Date.now(),
      expiresAt: computeExpiresAt(this.deps.ttlSeconds),
      provider: this.deps.provider.name,
      model: request.model,
    };

    await this.deps.cache.set(cacheKey, entry, this.deps.ttlSeconds);

    this.deps.events.emit('cacheWrite', {
      cacheKey,
      request,
      response,
      ttlSeconds: this.deps.ttlSeconds,
    });

    context.fromCache = false;
    context.response = response;
    context.durationMs = totalDurationMs;
    await this.deps.middleware.runAfterResponse(context);

    this.deps.logger.debug('Cache miss - stored response', {
      cacheKey,
      providerTimeMs,
      totalDurationMs,
    });

    return response;
  }

  private handleStreamMiss(
    request: ChatRequest,
    cacheKey: string,
    start: number,
    lookupTimeMs: number,
  ): AsyncIterable<StreamChunk> {
    const missDuration = performance.now() - start;
    this.deps.stats.recordMiss(missDuration, lookupTimeMs);
    this.deps.events.emit('cacheMiss', { cacheKey, request, durationMs: missDuration });

    const providerStart = performance.now();
    const requestTimeout = this.deps.timeout?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const deps = this.deps;

    async function* streamGenerator(): AsyncGenerator<StreamChunk> {
      const providerStream = await withRetry(
        () =>
          withTimeout(
            (signal) => Promise.resolve(deps.provider.chatStream(request, signal)),
            requestTimeout,
            'request',
          ),
        deps.retry,
      );

      const buffer = new StreamBuffer();
      let lastChunk: StreamChunk | undefined;

      for await (const chunk of providerStream) {
        buffer.add(chunk);
        lastChunk = chunk;
        yield chunk;
      }

      const providerTimeMs = performance.now() - providerStart;
      const totalDurationMs = performance.now() - start;

      const response: ChatResponse = {
        id: lastChunk?.id ?? 'stream-response',
        model: lastChunk?.model ?? request.model,
        content: null,
        role: lastChunk?.role ?? 'assistant',
        finish_reason: lastChunk?.finish_reason ?? 'stop',
        usage: lastChunk?.usage,
      };

      const streamData = buffer.toCachedData(response);

      deps.stats.recordProviderCall(providerTimeMs);
      deps.stats.recordWrite(request, streamData.response);
      deps.metrics.record({
        totalTimeMs: totalDurationMs,
        cacheLookupTimeMs: lookupTimeMs,
        providerTimeMs,
        executionTimeMs: totalDurationMs,
      });

      deps.events.emit('providerCall', {
        cacheKey,
        request,
        durationMs: providerTimeMs,
      });

      const entry: CacheEntry = {
        key: cacheKey,
        response: streamData.response,
        streamData,
        createdAt: Date.now(),
        expiresAt: computeExpiresAt(deps.ttlSeconds),
        provider: deps.provider.name,
        model: request.model,
      };

      await deps.cache.set(cacheKey, entry, deps.ttlSeconds);

      deps.events.emit('cacheWrite', {
        cacheKey,
        request,
        response: streamData.response,
        ttlSeconds: deps.ttlSeconds,
      });
    }

    return streamGenerator();
  }
}

export function createPipelineDeps(options: CreateAIOptions): PipelineDependencies {
  const loggerInput = resolveLoggerInput(options.logger);

  const events = new TypedEventEmitter();

  if (options.on) {
    const handlers = options.on;
    if (handlers.cacheHit) events.on('cacheHit', handlers.cacheHit);
    if (handlers.cacheMiss) events.on('cacheMiss', handlers.cacheMiss);
    if (handlers.cacheWrite) events.on('cacheWrite', handlers.cacheWrite);
    if (handlers.providerCall) events.on('providerCall', handlers.providerCall);
    if (handlers.error) events.on('error', handlers.error);
  }

  const costEstimator = new CostEstimator();

  return {
    provider: options.provider,
    cache: new CacheManager(options.cache),
    events,
    middleware: new MiddlewareManager(options.middleware ?? []),
    stats: new StatsTracker(costEstimator),
    metrics: new MetricsCollector(),
    logger: createLogger(loggerInput),
    ttlSeconds: parseTTL(options.ttl ?? DEFAULT_TTL_SECONDS),
    keyPrefix: options.keyPrefix,
    retry: options.retry,
    timeout: options.timeout,
  };
}

function resolveLoggerInput(logger: CreateAIOptions['logger']): LoggerInput {
  if (logger === undefined) {
    return 'disabled';
  }

  if (typeof logger === 'string') {
    return logger;
  }

  if ('debug' in logger) {
    return logger;
  }

  return logger.enabled === false ? 'disabled' : (logger.logger ?? 'console');
}
