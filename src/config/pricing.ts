export interface ModelPricing {
  promptPer1M: number;
  completionPer1M: number;
}

export const OPENAI_PRICING: Record<string, ModelPricing> = {
  'gpt-4.1': { promptPer1M: 2.0, completionPer1M: 8.0 },
  'gpt-4.1-mini': { promptPer1M: 0.4, completionPer1M: 1.6 },
  'gpt-4.1-nano': { promptPer1M: 0.1, completionPer1M: 0.4 },
  'gpt-4o': { promptPer1M: 2.5, completionPer1M: 10.0 },
  'gpt-4o-mini': { promptPer1M: 0.15, completionPer1M: 0.6 },
  'gpt-4-turbo': { promptPer1M: 10.0, completionPer1M: 30.0 },
  'gpt-4': { promptPer1M: 30.0, completionPer1M: 60.0 },
  'gpt-3.5-turbo': { promptPer1M: 0.5, completionPer1M: 1.5 },
  o1: { promptPer1M: 15.0, completionPer1M: 60.0 },
  'o1-mini': { promptPer1M: 3.0, completionPer1M: 12.0 },
  'o3-mini': { promptPer1M: 1.1, completionPer1M: 4.4 },
};

export function getModelPricing(model: string): ModelPricing {
  if (model in OPENAI_PRICING) {
    return OPENAI_PRICING[model];
  }

  const prefixMatch = Object.keys(OPENAI_PRICING).find((key) => model.startsWith(key));
  if (prefixMatch) {
    return OPENAI_PRICING[prefixMatch];
  }

  return { promptPer1M: 2.0, completionPer1M: 8.0 };
}
