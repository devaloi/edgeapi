import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types.js";

export function logger(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    const log = {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration,
      requestId: c.get("requestId"),
    };
    console.log(JSON.stringify(log));
  };
}
