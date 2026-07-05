import { describe, it, expect } from 'vitest';
import { parseTTL } from '../src/utils/ttl-parser.js';
import { createLogger } from '../src/utils/logger.js';

describe('ttl and logger gaps', () => {
  it('parses numeric string TTL', () => {
    expect(parseTTL('3600')).toBe(3600);
  });

  it('returns null for zero numeric TTL', () => {
    expect(parseTTL(0)).toBeNull();
  });

  it('creates disabled logger explicitly', () => {
    const logger = createLogger('disabled');
    logger.debug('a');
    logger.info('b');
    logger.warn('c');
    logger.error('d');
  });
});
