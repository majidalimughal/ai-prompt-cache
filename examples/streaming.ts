/**
 * Streaming example with cache buffer/replay
 *
 * Run: OPENAI_API_KEY=sk-... npx tsx examples/streaming.ts
 */
import { createAI, MemoryStore, OpenAIProvider } from '../src/index.js';

const ai = createAI({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  cache: new MemoryStore({ ttl: 3600 }),
});

const request = {
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user' as const, content: 'Count from 1 to 5 slowly' }],
};

async function consumeStream(label: string): Promise<void> {
  const stream = await ai.chatStream(request);
  process.stdout.write(`\n[${label}] `);
  for await (const chunk of stream) {
    process.stdout.write(chunk.delta);
  }
  process.stdout.write('\n');
}

await consumeStream('First call (miss)');
await consumeStream('Second call (hit)');

console.log('Stats:', ai.stats());
