/**
 * NestJS-style injectable service example
 *
 * Run: OPENAI_API_KEY=sk-... npx tsx examples/nestjs.ts
 */
import { createAI, MemoryStore, OpenAIProvider } from '../src/index.js';
import type { ChatRequest, ChatResponse } from '../src/index.js';

class AIService {
  private readonly client = createAI({
    provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
    cache: new MemoryStore({ ttl: 3600 }),
    middleware: [
      {
        beforeRequest: (ctx) => {
          console.log(`[AIService] Processing ${ctx.cacheKey}`);
        },
      },
    ],
  });

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.client.chat(request);
  }

  stats() {
    return this.client.stats();
  }

  async health() {
    return this.client.health();
  }
}

const service = new AIService();

const response = await service.chat({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user', content: 'Hello from NestJS-style service' }],
});

console.log(response.content);
console.log(service.stats());
