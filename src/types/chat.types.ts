export type MessageRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

export interface ChatMessage {
  role: MessageRole;
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface ToolDefinition {
  type: 'function';
  function: FunctionDefinition;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  tools?: ToolDefinition[];
  functions?: FunctionDefinition[];
  response_format?: { type: 'text' | 'json_object' };
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  seed?: number;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  id: string;
  model: string;
  content: string | null;
  role: MessageRole;
  finish_reason: string | null;
  usage?: TokenUsage;
  tool_calls?: ToolCall[];
  raw?: unknown;
}

export interface StreamChunk {
  id: string;
  model: string;
  delta: string;
  finish_reason: string | null;
  role?: MessageRole;
  usage?: TokenUsage;
  done: boolean;
}

export interface CachedStreamData {
  chunks: StreamChunk[];
  response: ChatResponse;
}
