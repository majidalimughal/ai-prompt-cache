/**
 * Next.js API route example (App Router)
 *
 * Copy to: app/api/chat/route.ts in your Next.js project
 */
import { createAI, MemoryStore, OpenAIProvider } from 'ai-prompt-cache';

const ai = createAI({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  cache: new MemoryStore({ ttl: '1h' }),
});

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as {
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

  return Response.json({
    content: response.content,
    stats: ai.stats(),
  });
}
