import type { TTLValue } from '../types/cache.types.js';
import { ConfigurationError } from '../errors/configuration.error.js';

const TTL_UNITS: Record<string, number> = {
  s: 1,
  sec: 1,
  secs: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  mins: 60,
  minute: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hrs: 3600,
  hour: 3600,
  hours: 3600,
  d: 86400,
  day: 86400,
  days: 86400,
};

const FOREVER_VALUES = new Set(['forever', 'infinite', 'never', '0', '-1']);

export function parseTTL(ttl: TTLValue | undefined): number | null {
  if (ttl == null) {
    return null;
  }

  if (typeof ttl === 'number') {
    if (ttl <= 0) {
      return null;
    }
    return ttl;
  }

  const normalized = ttl.trim().toLowerCase();

  if (FOREVER_VALUES.has(normalized)) {
    return null;
  }

  const numericOnly = Number(normalized);
  if (!Number.isNaN(numericOnly) && numericOnly > 0) {
    return numericOnly;
  }

  const match = /^(\d+(?:\.\d+)?)\s*([a-z]+)$/.exec(normalized);
  if (!match) {
    throw new ConfigurationError(`Invalid TTL value: "${ttl}"`, 'ttl');
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = TTL_UNITS[unit];

  if (!multiplier) {
    throw new ConfigurationError(`Unknown TTL unit: "${unit}"`, 'ttl');
  }

  return Math.round(amount * multiplier);
}

export function computeExpiresAt(ttlSeconds: number | null): number | null {
  if (ttlSeconds === null) {
    return null;
  }
  return Date.now() + ttlSeconds * 1000;
}

export function isExpired(expiresAt: number | null): boolean {
  if (expiresAt === null) {
    return false;
  }
  return Date.now() >= expiresAt;
}
