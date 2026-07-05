import type { Middleware, MiddlewareContext } from '../types/middleware.types.js';

export class MiddlewareManager {
  constructor(private readonly middleware: Middleware[] = []) {}

  async runBeforeRequest(context: MiddlewareContext): Promise<void> {
    for (const mw of this.middleware) {
      if (mw.beforeRequest) {
        await mw.beforeRequest(context);
      }
    }
  }

  async runAfterResponse(context: MiddlewareContext): Promise<void> {
    for (const mw of this.middleware) {
      if (mw.afterResponse) {
        await mw.afterResponse(context);
      }
    }
  }

  async runOnCacheHit(context: MiddlewareContext): Promise<void> {
    for (const mw of this.middleware) {
      if (mw.onCacheHit) {
        await mw.onCacheHit(context);
      }
      if (mw.beforeRequest) {
        await mw.beforeRequest(context);
      }
      if (mw.afterResponse) {
        await mw.afterResponse(context);
      }
    }
  }

  async runOnCacheMiss(context: MiddlewareContext): Promise<void> {
    for (const mw of this.middleware) {
      if (mw.onCacheMiss) {
        await mw.onCacheMiss(context);
      }
    }
  }
}
