/**
 * Express.js integration example
 *
 * Run: OPENAI_API_KEY=sk-... npx tsx examples/express.ts
 */
import express from 'express';
import { createAI, MemoryStore, OpenAIProvider } from '../src/index.js';

const ai = createAI({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  cache: new MemoryStore({ ttl: 3600 }),
});

const app = express();
app.use(express.json());

app.post('/chat', async (req, res) => {
  try {
    const { model = 'gpt-4.1-mini', messages } = req.body as {
      model?: string;
      messages: Array<{ role: string; content: string }>;
    };

    const response = await ai.chat({
      model,
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    });

    res.json({
      content: response.content,
      cached: ai.stats(),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/stats', (_req, res) => {
  res.json(ai.stats());
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
