import type OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { ChatRequest, ChatResponse, StreamChunk, ChatMessage } from '../types/chat.types.js';
import type { HealthStatus } from '../types/cache.types.js';
import type { LLMProvider } from './provider.interface.js';
import { ProviderError } from '../errors/provider.error.js';
import { ConfigurationError } from '../errors/configuration.error.js';

export interface OpenAIProviderOptions {
  apiKey?: string;
  organization?: string;
  baseURL?: string;
  defaultModel?: string;
  client?: OpenAI;
}

export class OpenAIProvider implements LLMProvider {
  public readonly name = 'openai';
  public readonly capabilities = {
    streaming: true,
    tools: true,
    functions: true,
  };

  private client: OpenAI | null;
  private readonly options: OpenAIProviderOptions;

  constructor(options: OpenAIProviderOptions = {}) {
    this.options = options;
    this.client = options.client ?? null;
  }

  async chat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
    const client = await this.getClient();

    try {
      const completion = await client.chat.completions.create(
        {
          model: request.model,
          messages: this.mapMessages(request.messages),
          temperature: request.temperature,
          top_p: request.top_p,
          max_tokens: request.max_tokens,
          tools: request.tools,
          functions: request.functions,
          response_format: request.response_format,
          stop: request.stop,
          presence_penalty: request.presence_penalty,
          frequency_penalty: request.frequency_penalty,
          seed: request.seed,
        },
        { signal },
      );

      return this.mapCompletion(completion, request.model);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async *chatStream(request: ChatRequest, signal?: AbortSignal): AsyncIterable<StreamChunk> {
    const client = await this.getClient();

    try {
      const stream = await client.chat.completions.create(
        {
          model: request.model,
          messages: this.mapMessages(request.messages),
          temperature: request.temperature,
          top_p: request.top_p,
          max_tokens: request.max_tokens,
          tools: request.tools,
          functions: request.functions,
          response_format: request.response_format,
          stop: request.stop,
          presence_penalty: request.presence_penalty,
          frequency_penalty: request.frequency_penalty,
          seed: request.seed,
          stream: true,
        },
        { signal },
      );

      for await (const chunk of stream) {
        yield this.mapStreamChunk(chunk, request.model);
      }
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async health(): Promise<HealthStatus> {
    try {
      const client = await this.getClient();
      const start = performance.now();
      await client.models.list();
      const latencyMs = performance.now() - start;

      return {
        healthy: true,
        cache: true,
        provider: true,
        details: { provider: this.name, latencyMs },
      };
    } catch (error) {
      return {
        healthy: false,
        cache: true,
        provider: false,
        details: {
          provider: this.name,
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  private async getClient(): Promise<OpenAI> {
    if (this.client) {
      return this.client;
    }

    let OpenAIModule: typeof import('openai');

    try {
      OpenAIModule = await import('openai');
    } catch {
      throw new ConfigurationError(
        'openai is required for OpenAIProvider. Install it with: pnpm add openai',
        'provider',
      );
    }

    const apiKey = this.options.apiKey ?? process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new ConfigurationError(
        'OpenAI API key is required. Set apiKey option or OPENAI_API_KEY environment variable.',
        'apiKey',
      );
    }

    this.client = new OpenAIModule.default({
      apiKey,
      organization: this.options.organization,
      baseURL: this.options.baseURL,
    });

    return this.client;
  }

  private mapMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
    return messages.map((message) => {
      const mapped: Record<string, unknown> = {
        role: message.role,
        content: message.content,
      };

      if (message.name) {
        mapped.name = message.name;
      }

      if (message.tool_calls) {
        mapped.tool_calls = message.tool_calls;
      }

      if (message.tool_call_id) {
        mapped.tool_call_id = message.tool_call_id;
      }

      return mapped as unknown as ChatCompletionMessageParam;
    });
  }

  private mapCompletion(completion: ChatCompletion, model: string): ChatResponse {
    const choice = completion.choices.length > 0 ? completion.choices[0] : undefined;
    const message = choice?.message;

    return {
      id: completion.id,
      model: completion.model || model,
      content: message?.content ?? null,
      role: message?.role ?? 'assistant',
      finish_reason: choice?.finish_reason ?? null,
      usage: completion.usage
        ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens,
          }
        : undefined,
      tool_calls: message?.tool_calls,
      raw: completion,
    };
  }

  private mapStreamChunk(chunk: ChatCompletionChunk, model: string): StreamChunk {
    const choice = chunk.choices.length > 0 ? chunk.choices[0] : undefined;
    const delta = choice?.delta;
    const finishReason = choice?.finish_reason ?? null;

    return {
      id: chunk.id,
      model: chunk.model || model,
      delta: delta?.content ?? '',
      finish_reason: finishReason,
      role: delta?.role as StreamChunk['role'],
      usage: chunk.usage
        ? {
            prompt_tokens: chunk.usage.prompt_tokens,
            completion_tokens: chunk.usage.completion_tokens,
            total_tokens: chunk.usage.total_tokens,
          }
        : undefined,
      done: finishReason !== null,
    };
  }

  private mapError(error: unknown): ProviderError {
    if (error instanceof ProviderError) {
      return error;
    }

    const err = error as { status?: number; message?: string };
    const statusCode = typeof err.status === 'number' ? err.status : undefined;
    const message = err.message ?? 'OpenAI provider request failed';

    return new ProviderError(message, this.name, {
      statusCode,
      cause: error instanceof Error ? error : undefined,
    });
  }
}
