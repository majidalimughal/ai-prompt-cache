import type { CreateAIOptions } from './types/config.types.js';
import { AIClient } from './ai-client.js';
import { ConfigurationError } from './errors/configuration.error.js';

export function createAI(options: CreateAIOptions): AIClient {
  const input = options as Partial<CreateAIOptions>;

  if (!input.provider) {
    throw new ConfigurationError('provider is required', 'provider');
  }

  if (!input.cache) {
    throw new ConfigurationError('cache is required', 'cache');
  }

  return new AIClient(options);
}
