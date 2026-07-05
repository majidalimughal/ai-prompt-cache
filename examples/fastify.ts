/**
 * Fastify integration example
 *
 * Run: OPENAI_API_KEY=sk-... npx tsx examples/fastify.ts
 */
import Fastify from 'fastify';
import { createAI, MemoryStore, OpenAIProvider } from '../src/index.js';

const ai = createAI({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  cache: new MemoryStore({ ttl: '1h' }),
});

const fastify = Fastify({ logger: true });

fastify.post('/chat', async (request) => {
  const body = request.body as {
    model?: string;
    messages: Array<{ role: string; content: string }>;
  };

  const response = await ai.chat({
    model: body.model ?? 'gpt-4.1-mini',
    messages: body.messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  });

  return { content: response.content, stats: ai.stats() };
});

fastify.get('/health', async () => ai.health());

const start = async (): Promise<void> => {
  await fastify.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' });
};

start().catch(console.error);
