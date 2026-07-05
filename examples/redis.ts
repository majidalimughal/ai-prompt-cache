/**
 * Redis cache example
 *
 * Run: OPENAI_API_KEY=sk-... npx tsx examples/redis.ts
 */
import { createAI, RedisStore, OpenAIProvider } from '../src/index.js';

const ai = createAI({
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
  }),
  cache: new RedisStore({
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
    ttl: '24h',
  }),
});

const response = await ai.chat({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user', content: 'What is prompt caching?' }],
});

console.log(response.content);
console.log('Cache stats:', ai.stats());
