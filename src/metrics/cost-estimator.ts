import type { ChatRequest, ChatResponse, TokenUsage } from '../types/chat.types.js';
import { CHARS_PER_TOKEN_ESTIMATE } from '../config/defaults.js';
import { getModelPricing } from '../config/pricing.js';

export interface CostEstimate {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export class CostEstimator {
  estimateFromUsage(model: string, usage: TokenUsage): CostEstimate {
    const pricing = getModelPricing(model);
    const promptCost = (usage.prompt_tokens / 1_000_000) * pricing.promptPer1M;
    const completionCost = (usage.completion_tokens / 1_000_000) * pricing.completionPer1M;

    return {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCostUsd: promptCost + completionCost,
    };
  }

  estimateFromRequestAndResponse(request: ChatRequest, response: ChatResponse): CostEstimate {
    if (response.usage) {
      return this.estimateFromUsage(request.model, response.usage);
    }

    const promptText = request.messages
      .map((m) => (typeof m.content === 'string' ? m.content : ''))
      .join(' ');
    const completionText = response.content ?? '';

    const promptTokens = Math.ceil(promptText.length / CHARS_PER_TOKEN_ESTIMATE);
    const completionTokens = Math.ceil(completionText.length / CHARS_PER_TOKEN_ESTIMATE);

    return this.estimateFromUsage(request.model, {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    });
  }
}
