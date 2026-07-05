import { describe, it, expect } from 'vitest';
import { getModelPricing } from '../src/config/pricing.js';

describe('pricing', () => {
  it('returns known model pricing', () => {
    const pricing = getModelPricing('gpt-4.1');
    expect(pricing.promptPer1M).toBe(2.0);
    expect(pricing.completionPer1M).toBe(8.0);
  });

  it('returns prefix match pricing', () => {
    const pricing = getModelPricing('gpt-4.1-custom');
    expect(pricing.promptPer1M).toBe(2.0);
  });

  it('returns default pricing for unknown models', () => {
    const pricing = getModelPricing('unknown-model-xyz');
    expect(pricing.promptPer1M).toBe(2.0);
  });
});
