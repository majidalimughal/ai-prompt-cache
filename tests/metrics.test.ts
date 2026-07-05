import { describe, it, expect } from 'vitest';
import { CostEstimator } from '../src/metrics/cost-estimator.js';
import { StatsTracker } from '../src/metrics/stats-tracker.js';
import { MetricsCollector } from '../src/metrics/metrics-collector.js';
import type { ChatRequest, ChatResponse } from '../src/types/chat.types.js';

const request: ChatRequest = {
  model: 'gpt-4.1',
  messages: [{ role: 'user', content: 'Hello' }],
};

const response: ChatResponse = {
  id: '1',
  model: 'gpt-4.1',
  content: 'Hi there',
  role: 'assistant',
  finish_reason: 'stop',
  usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
};

describe('CostEstimator', () => {
  it('estimates cost from usage', () => {
    const estimator = new CostEstimator();
    const cost = estimator.estimateFromUsage('gpt-4.1', response.usage!);
    expect(cost.promptTokens).toBe(100);
    expect(cost.completionTokens).toBe(50);
    expect(cost.estimatedCostUsd).toBeGreaterThan(0);
  });

  it('estimates cost from request and response without usage', () => {
    const estimator = new CostEstimator();
    const cost = estimator.estimateFromRequestAndResponse(request, {
      ...response,
      usage: undefined,
    });
    expect(cost.totalTokens).toBeGreaterThan(0);
  });
});

describe('StatsTracker', () => {
  it('tracks hits, misses, and hit ratio', () => {
    const estimator = new CostEstimator();
    const stats = new StatsTracker(estimator);

    stats.recordHit(request, response, 10, 2);
    stats.recordHit(request, response, 8, 1);
    stats.recordMiss(100, 3);

    const snapshot = stats.getStats();
    expect(snapshot.hits).toBe(2);
    expect(snapshot.misses).toBe(1);
    expect(snapshot.hitRatio).toBeCloseTo(2 / 3);
    expect(snapshot.estimatedCostSavedUsd).toBeGreaterThan(0);
    expect(snapshot.averageCachedResponseTimeMs).toBe(9);
  });

  it('tracks writes and provider time', () => {
    const estimator = new CostEstimator();
    const stats = new StatsTracker(estimator);

    stats.recordMiss(50, 2);
    stats.recordProviderCall(40);
    stats.recordWrite(request, response);

    const snapshot = stats.getStats();
    expect(snapshot.writes).toBe(1);
    expect(snapshot.averageProviderTimeMs).toBe(40);
  });
});

describe('MetricsCollector', () => {
  it('records and averages timing metrics', () => {
    const metrics = new MetricsCollector();
    metrics.record({ totalTimeMs: 100, cacheLookupTimeMs: 5, providerTimeMs: 80 });
    metrics.record({ totalTimeMs: 200, cacheLookupTimeMs: 10, providerTimeMs: 160 });

    const snapshot = metrics.getSnapshot();
    expect(snapshot.requestCount).toBe(2);
    expect(snapshot.averages.totalTimeMs).toBe(150);
  });
});
