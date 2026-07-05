import { describe, it, expect, vi } from 'vitest';
import { TypedEventEmitter } from '../src/events/event-emitter.js';

describe('TypedEventEmitter extended', () => {
  it('clears all handlers', () => {
    const emitter = new TypedEventEmitter();
    const handler = vi.fn();
    emitter.on('cacheMiss', handler);
    emitter.clear();
    emitter.emit('cacheMiss', {
      cacheKey: 'k',
      request: { model: 'gpt', messages: [] },
      durationMs: 1,
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('swallows handler errors', () => {
    const emitter = new TypedEventEmitter();
    emitter.on('cacheMiss', () => {
      throw new Error('handler error');
    });

    expect(() =>
      emitter.emit('cacheMiss', {
        cacheKey: 'k',
        request: { model: 'gpt', messages: [] },
        durationMs: 1,
      }),
    ).not.toThrow();
  });
});
