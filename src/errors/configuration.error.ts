import { AIPromptCacheError } from './base.error.js';

export class ConfigurationError extends AIPromptCacheError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
    this.field = field;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
