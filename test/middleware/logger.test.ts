import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import { requestId } from "../../src/middleware/request-id.js";
import { logger } from "../../src/middleware/logger.js";
import type { AppEnv } from "../../src/types.js";

describe("logger middleware", () => {
  it("logs request method, path, status, and duration", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const app = new Hono<AppEnv>();
    app.use(requestId());
    app.use(logger());
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test");

    expect(spy).toHaveBeenCalledOnce();
    const log = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(log.method).toBe("GET");
    expect(log.path).toBe("/test");
    expect(log.status).toBe(200);
    expect(typeof log.duration).toBe("number");
    expect(log.requestId).toBeTruthy();

    spy.mockRestore();
  });
});
