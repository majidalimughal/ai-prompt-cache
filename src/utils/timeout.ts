import { TimeoutError } from '../errors/timeout.error.js';

export interface WithTimeoutOptions {
  signal?: AbortSignal;
}

export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  phase: 'request' | 'cache' = 'request',
  options?: WithTimeoutOptions,
): Promise<T> {
  if (timeoutMs <= 0) {
    return operation(options?.signal ?? new AbortController().signal);
  }

  const controller = new AbortController();
  const externalSignal = options?.signal;

  const onExternalAbort = (): void => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => {
    controller.abort(
      new TimeoutError(`Operation timed out after ${String(timeoutMs)}ms`, timeoutMs, phase),
    );
  }, timeoutMs);

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted && error instanceof DOMException && error.name === 'AbortError') {
      const reason: unknown = controller.signal.reason;
      if (reason instanceof TimeoutError) {
        throw reason;
      }
      throw new TimeoutError(`Operation timed out after ${String(timeoutMs)}ms`, timeoutMs, phase);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export function createAbortError(): Error {
  const error = new Error('Operation aborted');
  error.name = 'AbortError';
  return error;
}
