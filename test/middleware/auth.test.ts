import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { auth } from "../../src/middleware/auth.js";
import { errorHandler } from "../../src/errors.js";
import type { AppEnv } from "../../src/types.js";

function createApp(apiKey: string, exclude?: string[]) {
  const app = new Hono<AppEnv>();
  app.use(auth({ apiKey, exclude }));
  app.onError(errorHandler);
  app.get("/test", (c) => c.json({ ok: true }));
  app.get("/health", (c) => c.json({ status: "ok" }));
  return app;
}

describe("auth middleware", () => {
  it("allows requests with valid API key", async () => {
    const app = createApp("secret-key");
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer secret-key" },
    });
    expect(res.status).toBe(200);
  });

  it("rejects requests without Authorization header", async () => {
    const app = createApp("secret-key");
    const res = await app.request("/test");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.title).toBe("Unauthorized");
  });

  it("rejects requests with wrong API key", async () => {
    const app = createApp("secret-key");
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer wrong-key" },
    });
    expect(res.status).toBe(401);
  });

  it("rejects requests with wrong scheme", async () => {
    const app = createApp("secret-key");
    const res = await app.request("/test", {
      headers: { Authorization: "Basic secret-key" },
    });
    expect(res.status).toBe(401);
  });

  it("skips excluded paths", async () => {
    const app = createApp("secret-key", ["/health"]);
    const res = await app.request("/health");
    expect(res.status).toBe(200);
  });
});
