import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../src/providers/openai-provider.js';
import { ConfigurationError } from '../src/errors/configuration.error.js';
import { ProviderError } from '../src/errors/provider.error.js';
import type { ChatRequest } from '../src/types/chat.types.js';

const mockCreate = vi.fn();
const mockModelsList = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
    models: { list: mockModelsList },
  })),
}));

describe('OpenAIProvider', () => {
  const request: ChatRequest = {
    model: 'gpt-4.1',
    messages: [{ role: 'user', content: 'Hello' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps chat completion response', async () => {
    mockCreate.mockResolvedValue({
      id: 'chat-1',
      model: 'gpt-4.1',
      choices: [{ message: { role: 'assistant', content: 'Hi!' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
    });

    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const response = await provider.chat(request);

    expect(response.content).toBe('Hi!');
    expect(response.usage?.total_tokens).toBe(7);
  });

  it('maps streaming chunks', async () => {
    async function* stream() {
      yield {
        id: 'chat-1',
        model: 'gpt-4.1',
        choices: [{ delta: { content: 'Hi' }, finish_reason: null }],
      };
      yield {
        id: 'chat-1',
        model: 'gpt-4.1',
        choices: [{ delta: { content: '!' }, finish_reason: 'stop' }],
      };
    }

    mockCreate.mockResolvedValue(stream());

    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const chunks = [];
    for await (const chunk of provider.chatStream(request)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.delta).toBe('Hi');
  });

  it('throws ConfigurationError without API key', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const provider = new OpenAIProvider();
    await expect(provider.chat(request)).rejects.toThrow(ConfigurationError);

    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });

  it('maps provider errors', async () => {
    mockCreate.mockRejectedValue({ status: 500, message: 'Server error' });

    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    await expect(provider.chat(request)).rejects.toThrow(ProviderError);
  });

  it('reports health status', async () => {
    mockModelsList.mockResolvedValue({ data: [] });

    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const health = await provider.health();
    expect(health.provider).toBe(true);
  });
});
