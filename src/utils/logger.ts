import type { Logger } from '../types/logger.types.js';

const noop = (): void => undefined;

const disabledLogger: Logger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

const consoleLogger: Logger = {
  debug: (message, meta) => {
    console.debug(`[ai-prompt-cache] ${message}`, meta ?? '');
  },
  info: (message, meta) => {
    console.info(`[ai-prompt-cache] ${message}`, meta ?? '');
  },
  warn: (message, meta) => {
    console.warn(`[ai-prompt-cache] ${message}`, meta ?? '');
  },
  error: (message, meta) => {
    console.error(`[ai-prompt-cache] ${message}`, meta ?? '');
  },
};

export type LoggerInput = Logger | 'console' | 'disabled';

export function createLogger(input?: LoggerInput): Logger {
  if (!input || input === 'disabled') {
    return disabledLogger;
  }

  if (input === 'console') {
    return consoleLogger;
  }

  return input;
}
