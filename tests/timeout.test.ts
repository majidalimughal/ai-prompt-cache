import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout } from '../src/utils/timeout.js';
import { TimeoutError } from '../src/errors/timeout.error.js';

describe('timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves when operation completes in time', async () => {
    const promise = withTimeout(async () => 'done', 1000);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('done');
  });

  it('throws TimeoutError when operation exceeds timeout', async () => {
    const promise = withTimeout(async (signal) => {
      return new Promise<string>((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(signal.reason);
        });
      });
    }, 500);

    const expectation = expect(promise).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(600);
    await expectation;
  });
});
