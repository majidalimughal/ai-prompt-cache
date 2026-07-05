export interface TimingMetrics {
  totalTimeMs: number;
  cacheLookupTimeMs: number;
  providerTimeMs: number;
  executionTimeMs: number;
}

export class MetricsCollector {
  private totalTimeMs = 0;
  private cacheLookupTimeMs = 0;
  private providerTimeMs = 0;
  private executionTimeMs = 0;
  private requestCount = 0;

  record(metrics: Partial<TimingMetrics>): void {
    if (metrics.totalTimeMs !== undefined) {
      this.totalTimeMs += metrics.totalTimeMs;
    }
    if (metrics.cacheLookupTimeMs !== undefined) {
      this.cacheLookupTimeMs += metrics.cacheLookupTimeMs;
    }
    if (metrics.providerTimeMs !== undefined) {
      this.providerTimeMs += metrics.providerTimeMs;
    }
    if (metrics.executionTimeMs !== undefined) {
      this.executionTimeMs += metrics.executionTimeMs;
    }
    this.requestCount++;
  }

  getSnapshot(): TimingMetrics & { requestCount: number; averages: TimingMetrics } {
    const count = this.requestCount || 1;

    return {
      totalTimeMs: this.totalTimeMs,
      cacheLookupTimeMs: this.cacheLookupTimeMs,
      providerTimeMs: this.providerTimeMs,
      executionTimeMs: this.executionTimeMs,
      requestCount: this.requestCount,
      averages: {
        totalTimeMs: this.totalTimeMs / count,
        cacheLookupTimeMs: this.cacheLookupTimeMs / count,
        providerTimeMs: this.providerTimeMs / count,
        executionTimeMs: this.executionTimeMs / count,
      },
    };
  }

  reset(): void {
    this.totalTimeMs = 0;
    this.cacheLookupTimeMs = 0;
    this.providerTimeMs = 0;
    this.executionTimeMs = 0;
    this.requestCount = 0;
  }
}
