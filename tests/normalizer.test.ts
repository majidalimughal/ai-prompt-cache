import { describe, it, expect } from 'vitest';
import { normalizeWhitespace, normalizeObject, normalizeValue } from '../src/utils/normalizer.js';

describe('normalizer', () => {
  it('normalizes whitespace in strings', () => {
    expect(normalizeWhitespace('  hello   world  ')).toBe('hello world');
  });

  it('sorts object keys', () => {
    const result = normalizeObject({ b: 2, a: 1 });
    expect(Object.keys(result)).toEqual(['a', 'b']);
  });

  it('normalizes nested objects and arrays', () => {
    const input = {
      z: [{ b: 2, a: 1 }],
      a: '  text  ',
    };
    const result = normalizeValue(input) as Record<string, unknown>;
    expect(result.a).toBe('text');
    expect(Object.keys(result)).toEqual(['a', 'z']);
  });

  it('skips undefined values in objects', () => {
    const result = normalizeObject({ a: 1, b: undefined });
    expect(result).toEqual({ a: 1 });
  });
});
