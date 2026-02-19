import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { MemoryStorage } from "./storage/memory.js";

const port = parseInt(process.env["PORT"] ?? "3000", 10);
const apiKey = process.env["API_KEY"] ?? "dev-api-key";
const rateLimitMax = parseInt(
  process.env["RATE_LIMIT_MAX"] ?? "100",
  10
);
const rateLimitWindowMs = parseInt(
  process.env["RATE_LIMIT_WINDOW_MS"] ?? "60000",
  10
);

const storage = new MemoryStorage();

const app = createApp({
  storage,
  apiKey,
  rateLimitMax,
  rateLimitWindowMs,
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`edgeapi listening on http://localhost:${info.port}`);
});
