import type { AIEvents, AIEventName } from '../types/events.types.js';

type EventHandler<T> = (payload: T) => void;

export class TypedEventEmitter {
  private readonly handlers = new Map<AIEventName, Set<EventHandler<unknown>>>();

  on<K extends AIEventName>(event: K, handler: EventHandler<AIEvents[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)?.add(handler as EventHandler<unknown>);
  }

  off<K extends AIEventName>(event: K, handler: EventHandler<AIEvents[K]>): void {
    this.handlers.get(event)?.delete(handler as EventHandler<unknown>);
  }

  emit<K extends AIEventName>(event: K, payload: AIEvents[K]): void {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) {
      return;
    }

    for (const handler of eventHandlers) {
      try {
        handler(payload);
      } catch {
        // Event handlers should not break the pipeline
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
