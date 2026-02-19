import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { requestId } from "../../src/middleware/request-id.js";
import type { AppEnv } from "../../src/types.js";

function createApp() {
  const app = new Hono<AppEnv>();
  app.use(requestId());
  app.get("/test", (c) => c.json({ id: c.get("requestId") }));
  return app;
}

describe("requestId middleware", () => {
  it("generates a request id when none provided", async () => {
    const app = createApp();
    const res = await app.request("/test");
    const header = res.headers.get("X-Request-Id");
    expect(header).toBeTruthy();
    const body = await res.json();
    expect(body.id).toBe(header);
  });

  it("uses provided X-Request-Id header", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      headers: { "X-Request-Id": "custom-123" },
    });
    expect(res.headers.get("X-Request-Id")).toBe("custom-123");
    const body = await res.json();
    expect(body.id).toBe("custom-123");
  });
});
