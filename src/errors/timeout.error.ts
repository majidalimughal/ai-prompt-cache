import { AIPromptCacheError } from './base.error.js';

export class TimeoutError extends AIPromptCacheError {
  public readonly timeoutMs: number;
  public readonly phase: 'request' | 'cache';

  constructor(message: string, timeoutMs: number, phase: 'request' | 'cache' = 'request') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    this.phase = phase;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
