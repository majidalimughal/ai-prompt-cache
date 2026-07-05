#!/usr/bin/env node
/**
 * CLI example
 *
 * Run: OPENAI_API_KEY=sk-... npx tsx examples/cli.ts "Explain TypeScript"
 */
import { createAI, MemoryStore, OpenAIProvider } from '../src/index.js';

const prompt = process.argv[2] ?? 'What is ai-prompt-cache?';

const ai = createAI({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  cache: new MemoryStore({ ttl: '24h' }),
  logger: 'console',
  on: {
    cacheHit: () => console.log('✓ Cache hit'),
    cacheMiss: () => console.log('→ Cache miss, calling provider'),
  },
});

const response = await ai.chat({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user', content: prompt }],
});

console.log('\n--- Response ---');
console.log(response.content);
console.log('\n--- Stats ---');
console.log(JSON.stringify(ai.stats(), null, 2));
