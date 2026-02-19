import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types.js";
import { tooManyRequests } from "../errors.js";

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

export function rateLimit(config: RateLimitConfig): MiddlewareHandler<AppEnv> {
  const windows = new Map<string, WindowEntry>();

  return async (c, next) => {
    const key = c.req.header("x-forwarded-for") ?? "global";
    const now = Date.now();
    let entry = windows.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + config.windowMs };
      windows.set(key, entry);
    }

    entry.count++;

    c.header("X-RateLimit-Limit", config.max.toString());
    c.header(
      "X-RateLimit-Remaining",
      Math.max(0, config.max - entry.count).toString()
    );
    c.header(
      "X-RateLimit-Reset",
      Math.ceil(entry.resetAt / 1000).toString()
    );

    if (entry.count > config.max) {
      throw tooManyRequests("Rate limit exceeded");
    }

    await next();
  };
}
