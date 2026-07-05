import { describe, it, expect, vi } from 'vitest';
import { TypedEventEmitter } from '../src/events/event-emitter.js';

describe('TypedEventEmitter', () => {
  it('registers and emits events', () => {
    const emitter = new TypedEventEmitter();
    const handler = vi.fn();

    emitter.on('cacheHit', handler);
    emitter.emit('cacheHit', {
      cacheKey: 'key',
      request: { model: 'gpt-4.1', messages: [] },
      entry: {
        key: 'key',
        response: {
          id: '1',
          model: 'gpt-4.1',
          content: 'hi',
          role: 'assistant',
          finish_reason: 'stop',
        },
        createdAt: Date.now(),
        expiresAt: null,
        provider: 'mock',
        model: 'gpt-4.1',
      },
      durationMs: 5,
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('removes event handlers', () => {
    const emitter = new TypedEventEmitter();
    const handler = vi.fn();

    emitter.on('cacheMiss', handler);
    emitter.off('cacheMiss', handler);
    emitter.emit('cacheMiss', {
      cacheKey: 'key',
      request: { model: 'gpt-4.1', messages: [] },
      durationMs: 5,
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
