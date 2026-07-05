import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry } from '../src/utils/retry.js';
import { ProviderError } from '../src/errors/provider.error.js';

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns on first success', async () => {
    const result = await withRetry(async () => 'ok');
    expect(result).toBe('ok');
  });

  it('retries on retryable errors', async () => {
    let attempts = 0;
    const promise = withRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          throw new ProviderError('Rate limit', 'openai', { statusCode: 429 });
        }
        return 'success';
      },
      { maxRetries: 3, initialDelayMs: 100 },
    );

    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('does not retry non-retryable errors', async () => {
    let attempts = 0;
    await expect(
      withRetry(async () => {
        attempts++;
        throw new ProviderError('Bad request', 'openai', { statusCode: 400 });
      }),
    ).rejects.toThrow('Bad request');
    expect(attempts).toBe(1);
  });
});
