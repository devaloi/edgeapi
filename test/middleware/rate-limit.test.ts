import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { rateLimit } from "../../src/middleware/rate-limit.js";
import { errorHandler } from "../../src/errors.js";
import type { AppEnv } from "../../src/types.js";

function createApp(max: number, windowMs: number) {
  const app = new Hono<AppEnv>();
  app.use(rateLimit({ max, windowMs }));
  app.onError(errorHandler);
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
}

describe("rateLimit middleware", () => {
  it("allows requests within the limit", async () => {
    const app = createApp(3, 60000);
    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("3");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("2");
  });

  it("blocks requests exceeding the limit", async () => {
    const app = createApp(2, 60000);

    await app.request("/test");
    await app.request("/test");
    const res = await app.request("/test");

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.title).toBe("Too Many Requests");
  });

  it("sets rate limit headers", async () => {
    const app = createApp(10, 60000);
    const res = await app.request("/test");

    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("9");
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });
});
