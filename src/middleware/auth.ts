import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types.js";
import { unauthorized } from "../errors.js";

export interface AuthConfig {
  apiKey: string;
  exclude?: string[];
}

export function auth(config: AuthConfig): MiddlewareHandler<AppEnv> {
  const excluded = new Set(config.exclude ?? []);

  return async (c, next) => {
    if (excluded.has(c.req.path)) {
      await next();
      return;
    }

    const header = c.req.header("authorization");
    if (!header) {
      throw unauthorized("Missing Authorization header");
    }

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || token !== config.apiKey) {
      throw unauthorized("Invalid API key");
    }

    await next();
  };
}
