import { describe, it, expect } from 'vitest';
import { withTimeout, createAbortError } from '../src/utils/timeout.js';

describe('timeout extended', () => {
  it('passes through when timeout is zero', async () => {
    const result = await withTimeout(async () => 'immediate', 0);
    expect(result).toBe('immediate');
  });

  it('creates abort error', () => {
    const error = createAbortError();
    expect(error.name).toBe('AbortError');
  });

  it('propagates non-timeout errors', async () => {
    await expect(
      withTimeout(async () => {
        throw new Error('custom error');
      }, 5000),
    ).rejects.toThrow('custom error');
  });
});
