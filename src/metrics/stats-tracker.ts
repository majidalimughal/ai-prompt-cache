import type { CacheStats } from '../types/cache.types.js';
import type { CostEstimator } from './cost-estimator.js';
import type { ChatRequest, ChatResponse } from '../types/chat.types.js';

interface StatsRecord {
  hits: number;
  misses: number;
  writes: number;
  estimatedCostSavedUsd: number;
  estimatedTotalCostUsd: number;
  totalResponseTimeMs: number;
  totalCachedResponseTimeMs: number;
  totalProviderTimeMs: number;
  totalCacheLookupTimeMs: number;
  cachedHits: number;
}

export class StatsTracker {
  private stats: StatsRecord = this.createEmptyStats();

  constructor(private readonly costEstimator: CostEstimator) {}

  recordHit(
    request: ChatRequest,
    response: ChatResponse,
    durationMs: number,
    cacheLookupTimeMs: number,
  ): void {
    this.stats.hits++;
    this.stats.cachedHits++;
    this.stats.totalCachedResponseTimeMs += durationMs;
    this.stats.totalCacheLookupTimeMs += cacheLookupTimeMs;
    this.stats.totalResponseTimeMs += durationMs;

    const cost = this.costEstimator.estimateFromRequestAndResponse(request, response);
    this.stats.estimatedCostSavedUsd += cost.estimatedCostUsd;
  }

  recordMiss(durationMs: number, cacheLookupTimeMs: number): void {
    this.stats.misses++;
    this.stats.totalResponseTimeMs += durationMs;
    this.stats.totalCacheLookupTimeMs += cacheLookupTimeMs;
  }

  recordWrite(request: ChatRequest, response: ChatResponse): void {
    this.stats.writes++;
    const cost = this.costEstimator.estimateFromRequestAndResponse(request, response);
    this.stats.estimatedTotalCostUsd += cost.estimatedCostUsd;
  }

  recordProviderCall(providerTimeMs: number): void {
    this.stats.totalProviderTimeMs += providerTimeMs;
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRatio = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      writes: this.stats.writes,
      hitRatio,
      estimatedCostSavedUsd: roundUsd(this.stats.estimatedCostSavedUsd),
      estimatedTotalCostUsd: roundUsd(this.stats.estimatedTotalCostUsd),
      averageResponseTimeMs: average(this.stats.totalResponseTimeMs, totalRequests),
      averageCachedResponseTimeMs: average(
        this.stats.totalCachedResponseTimeMs,
        this.stats.cachedHits,
      ),
      averageProviderTimeMs: average(this.stats.totalProviderTimeMs, this.stats.misses),
      averageCacheLookupTimeMs: average(this.stats.totalCacheLookupTimeMs, totalRequests),
      totalRequests,
    };
  }

  reset(): void {
    this.stats = this.createEmptyStats();
  }

  private createEmptyStats(): StatsRecord {
    return {
      hits: 0,
      misses: 0,
      writes: 0,
      estimatedCostSavedUsd: 0,
      estimatedTotalCostUsd: 0,
      totalResponseTimeMs: 0,
      totalCachedResponseTimeMs: 0,
      totalProviderTimeMs: 0,
      totalCacheLookupTimeMs: 0,
      cachedHits: 0,
    };
  }
}

function average(total: number, count: number): number {
  if (count === 0) {
    return 0;
  }
  return roundMs(total / count);
}

function roundMs(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
