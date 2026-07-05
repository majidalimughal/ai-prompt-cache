import { describe, it, expect } from 'vitest';
import { MetricsCollector } from '../src/metrics/metrics-collector.js';
import { StatsTracker } from '../src/metrics/stats-tracker.js';
import { CostEstimator } from '../src/metrics/cost-estimator.js';

describe('metrics extended', () => {
  it('resets metrics collector', () => {
    const metrics = new MetricsCollector();
    metrics.record({ totalTimeMs: 100 });
    metrics.reset();
    expect(metrics.getSnapshot().requestCount).toBe(0);
  });

  it('resets stats tracker', () => {
    const stats = new StatsTracker(new CostEstimator());
    stats.recordMiss(10, 2);
    stats.reset();
    expect(stats.getStats().totalRequests).toBe(0);
  });
});
