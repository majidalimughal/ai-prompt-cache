import { describe, it, expect, vi } from 'vitest';
import { createLogger } from '../src/utils/logger.js';

describe('logger', () => {
  it('creates disabled logger by default', () => {
    const logger = createLogger();
    expect(() => logger.debug('test')).not.toThrow();
  });

  it('creates console logger', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    const logger = createLogger('console');
    logger.debug('hello');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('uses custom logger', () => {
    const custom = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const logger = createLogger(custom);
    logger.info('test');
    expect(custom.info).toHaveBeenCalledWith('test');
  });
});
