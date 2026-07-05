export const DEFAULT_TTL_SECONDS = 3600;

export const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;

export const DEFAULT_CACHE_LOOKUP_TIMEOUT_MS = 5_000;

export const DEFAULT_RETRY = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 10_000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
} as const;

export const CACHE_KEY_PREFIX = 'apc:v1';

export const CHARS_PER_TOKEN_ESTIMATE = 4;
