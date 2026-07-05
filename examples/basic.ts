/**
 * Basic example — memory cache + OpenAI provider
 *
 * Run: OPENAI_API_KEY=sk-... npx tsx examples/basic.ts
 */
import { createAI, MemoryStore, OpenAIProvider } from '../src/index.js';

const ai = createAI({
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
  }),
  cache: new MemoryStore({ ttl: '1h' }),
  logger: 'console',
});

const response = await ai.chat({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user', content: 'Explain Redis in one sentence' }],
});

console.log('Response:', response.content);
console.log('Stats:', ai.stats());
