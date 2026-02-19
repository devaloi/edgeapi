import { Hono } from "hono";
import type { AppEnv } from "../types.js";

export const healthRoutes = new Hono<AppEnv>();

healthRoutes.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

healthRoutes.get("/ready", (c) => {
  const storage = c.get("storage");
  return c.json({
    status: "ready",
    checks: {
      storage: storage ? "ok" : "unavailable",
    },
  });
});
