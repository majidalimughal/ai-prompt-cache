import { describe, it, expect } from 'vitest';
import {
  AIPromptCacheError,
  ProviderError,
  CacheError,
  TimeoutError,
  ConfigurationError,
} from '../src/errors/index.js';

describe('errors', () => {
  it('creates base error with code', () => {
    const error = new AIPromptCacheError('test', 'TEST_CODE');
    expect(error.message).toBe('test');
    expect(error.code).toBe('TEST_CODE');
    expect(error).toBeInstanceOf(Error);
  });

  it('creates ProviderError with status code', () => {
    const error = new ProviderError('failed', 'openai', { statusCode: 500 });
    expect(error.provider).toBe('openai');
    expect(error.statusCode).toBe(500);
    expect(error).toBeInstanceOf(AIPromptCacheError);
  });

  it('creates CacheError with store name', () => {
    const error = new CacheError('cache failed', 'redis');
    expect(error.store).toBe('redis');
  });

  it('creates TimeoutError with phase', () => {
    const error = new TimeoutError('timed out', 5000, 'request');
    expect(error.timeoutMs).toBe(5000);
    expect(error.phase).toBe('request');
  });

  it('creates ConfigurationError with field', () => {
    const error = new ConfigurationError('invalid config', 'apiKey');
    expect(error.field).toBe('apiKey');
  });
});
