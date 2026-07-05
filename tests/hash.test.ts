import { describe, it, expect } from 'vitest';
import { sha256 } from '../src/utils/hash.js';

describe('sha256', () => {
  it('produces deterministic hashes', () => {
    const hash1 = sha256('hello');
    const hash2 = sha256('hello');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('produces different hashes for different inputs', () => {
    expect(sha256('hello')).not.toBe(sha256('world'));
  });
});
