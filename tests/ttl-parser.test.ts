import { describe, it, expect } from 'vitest';
import { parseTTL, computeExpiresAt, isExpired } from '../src/utils/ttl-parser.js';
import { ConfigurationError } from '../src/errors/configuration.error.js';

describe('ttl-parser', () => {
  it('parses numeric seconds', () => {
    expect(parseTTL(3600)).toBe(3600);
  });

  it('parses string durations', () => {
    expect(parseTTL('5m')).toBe(300);
    expect(parseTTL('1h')).toBe(3600);
    expect(parseTTL('24h')).toBe(86400);
  });

  it('returns null for forever', () => {
    expect(parseTTL('forever')).toBeNull();
    expect(parseTTL(null)).toBeNull();
  });

  it('throws on invalid TTL', () => {
    expect(() => parseTTL('invalid')).toThrow(ConfigurationError);
  });

  it('detects expiration', () => {
    const past = Date.now() - 1000;
    const future = Date.now() + 60_000;
    expect(isExpired(past)).toBe(true);
    expect(isExpired(future)).toBe(false);
    expect(isExpired(null)).toBe(false);
  });

  it('computes expires at', () => {
    const now = Date.now();
    const expires = computeExpiresAt(60);
    expect(expires).toBeGreaterThan(now);
  });
});
