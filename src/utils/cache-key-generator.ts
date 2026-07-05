import type { ChatRequest } from '../types/chat.types.js';
import { sha256 } from './hash.js';
import { normalizeMessages, normalizeObject, normalizeValue } from './normalizer.js';

const KEY_VERSION = 'apc:v1';

export interface CacheKeyInput {
  provider: string;
  request: ChatRequest;
  keyPrefix?: string;
}

export function extractSystemPrompt(messages: ChatRequest['messages']): string | null {
  const systemMessages = messages
    .filter((m) => m.role === 'system')
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .filter(Boolean);

  return systemMessages.length > 0 ? systemMessages.join('\n') : null;
}

export function buildCanonicalPayload(input: CacheKeyInput): Record<string, unknown> {
  const { request, provider } = input;
  const messages = normalizeMessages(
    request.messages.map((m) => ({
      role: m.role,
      content: m.content,
      name: m.name,
      tool_call_id: m.tool_call_id,
      tool_calls: m.tool_calls,
    })),
  );

  const payload: Record<string, unknown> = {
    provider,
    model: request.model,
    messages,
    system: extractSystemPrompt(request.messages),
  };

  const optionalFields: Array<[string, unknown]> = [
    ['temperature', request.temperature],
    ['top_p', request.top_p],
    ['max_tokens', request.max_tokens],
    ['tools', request.tools ? normalizeValue(request.tools) : undefined],
    ['functions', request.functions ? normalizeValue(request.functions) : undefined],
    ['response_format', request.response_format],
    ['stop', request.stop],
    ['presence_penalty', request.presence_penalty],
    ['frequency_penalty', request.frequency_penalty],
    ['seed', request.seed],
  ];

  for (const [key, value] of optionalFields) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  return normalizeObject(payload);
}

export function generateCacheKey(input: CacheKeyInput): string {
  const canonical = buildCanonicalPayload(input);
  const hash = sha256(JSON.stringify(canonical));
  const prefix = input.keyPrefix ?? KEY_VERSION;
  return `${prefix}:${hash}`;
}
