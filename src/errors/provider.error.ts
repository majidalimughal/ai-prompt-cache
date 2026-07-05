import { AIPromptCacheError } from './base.error.js';

export class ProviderError extends AIPromptCacheError {
  public readonly provider: string;
  public readonly statusCode?: number;

  constructor(message: string, provider: string, options?: { statusCode?: number; cause?: Error }) {
    super(message, 'PROVIDER_ERROR', options?.cause);
    this.name = 'ProviderError';
    this.provider = provider;
    this.statusCode = options?.statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
