import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../src/providers/openai-provider.js';

const mockCreate = vi.fn();
const mockModelsList = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
    models: { list: mockModelsList },
  })),
}));

describe('OpenAIProvider extended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports unhealthy when models.list fails', async () => {
    mockModelsList.mockRejectedValue(new Error('auth failed'));
    const provider = new OpenAIProvider({ apiKey: 'test' });
    const health = await provider.health();
    expect(health.healthy).toBe(false);
    expect(health.provider).toBe(false);
  });

  it('re-throws ProviderError as-is', async () => {
    const { ProviderError } = await import('../src/errors/provider.error.js');
    const existing = new ProviderError('existing', 'openai');
    mockCreate.mockRejectedValue(existing);

    const provider = new OpenAIProvider({ apiKey: 'test' });
    await expect(
      provider.chat({ model: 'gpt-4.1', messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toBe(existing);
  });
});
