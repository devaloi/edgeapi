import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { healthRoutes } from "../../src/routes/health.js";
import type { AppEnv } from "../../src/types.js";
import { MemoryStorage } from "../../src/storage/memory.js";

function createApp() {
  const app = new Hono<AppEnv>();
  const storage = new MemoryStorage();
  app.use(async (c, next) => {
    c.set("storage", storage);
    await next();
  });
  app.route("/", healthRoutes);
  return app;
}

describe("health routes", () => {
  it("GET /health returns ok with timestamp", async () => {
    const app = createApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeTruthy();
  });

  it("GET /ready returns ready with storage check", async () => {
    const app = createApp();
    const res = await app.request("/ready");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ready");
    expect(body.checks.storage).toBe("ok");
  });
});
