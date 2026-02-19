import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types.js";
import { errorHandler } from "./errors.js";
import { requestId } from "./middleware/request-id.js";
import { logger } from "./middleware/logger.js";
import { auth } from "./middleware/auth.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { healthRoutes } from "./routes/health.js";
import { notesRoutes } from "./routes/notes.js";
import type { StorageAdapter } from "./storage/adapter.js";

export interface AppConfig {
  storage: StorageAdapter;
  apiKey: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
}

export function createApp(config: AppConfig): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(logger());
  app.use(cors());
  app.use(
    rateLimit({
      max: config.rateLimitMax ?? 100,
      windowMs: config.rateLimitWindowMs ?? 60_000,
    })
  );
  app.use(
    auth({
      apiKey: config.apiKey,
      exclude: ["/health", "/ready"],
    })
  );

  app.use(async (c, next) => {
    c.set("storage", config.storage);
    await next();
  });

  app.route("/", healthRoutes);
  app.route("/api/v1/notes", notesRoutes);

  app.onError(errorHandler);

  return app;
}
