import { ProviderError } from '../errors/provider.error.js';

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
  isRetryable?: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

export function resolveRetryOptions(partial?: Partial<RetryOptions>): RetryOptions {
  return {
    ...DEFAULT_RETRY_OPTIONS,
    ...partial,
    retryableStatusCodes:
      partial?.retryableStatusCodes ?? DEFAULT_RETRY_OPTIONS.retryableStatusCodes,
  };
}

function isRetryableError(error: Error, options: RetryOptions): boolean {
  if (options.isRetryable) {
    return options.isRetryable(error);
  }

  if (error instanceof ProviderError) {
    if (error.statusCode && options.retryableStatusCodes.includes(error.statusCode)) {
      return true;
    }
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('rate limit') ||
    message.includes('429')
  );
}

function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.25 * delay;
  return Math.min(delay + jitter, options.maxDelayMs);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  partialOptions?: Partial<RetryOptions>,
): Promise<T> {
  const options = resolveRetryOptions(partialOptions);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt >= options.maxRetries || !isRetryableError(lastError, options)) {
        throw lastError;
      }

      const delay = calculateDelay(attempt, options);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Retry failed');
}
