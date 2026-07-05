import { AIPromptCacheError } from './base.error.js';

export class CacheError extends AIPromptCacheError {
  public readonly store: string;

  constructor(message: string, store: string, cause?: Error) {
    super(message, 'CACHE_ERROR', cause);
    this.name = 'CacheError';
    this.store = store;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
