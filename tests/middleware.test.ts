import { describe, it, expect, vi } from 'vitest';
import { MiddlewareManager } from '../src/middleware/middleware-manager.js';
import type { MiddlewareContext } from '../src/types/middleware.types.js';

const baseContext: MiddlewareContext = {
  cacheKey: 'test-key',
  request: { model: 'gpt-4.1', messages: [{ role: 'user', content: 'hi' }] },
  fromCache: false,
  durationMs: 10,
};

describe('MiddlewareManager', () => {
  it('runs all middleware hooks', async () => {
    const beforeRequest = vi.fn();
    const afterResponse = vi.fn();
    const onCacheHit = vi.fn();
    const onCacheMiss = vi.fn();

    const manager = new MiddlewareManager([
      { beforeRequest, afterResponse, onCacheHit, onCacheMiss },
    ]);

    await manager.runBeforeRequest(baseContext);
    await manager.runOnCacheMiss(baseContext);
    await manager.runOnCacheHit({ ...baseContext, fromCache: true });
    await manager.runAfterResponse(baseContext);

    expect(beforeRequest).toHaveBeenCalled();
    expect(afterResponse).toHaveBeenCalled();
    expect(onCacheHit).toHaveBeenCalled();
    expect(onCacheMiss).toHaveBeenCalled();
  });
});
