import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "./types.js";

export class AppError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    public readonly title: string,
    public readonly detail: string,
    public readonly instance?: string
  ) {
    super(detail);
    this.name = "AppError";
  }

  toJSON() {
    return {
      type: "about:blank",
      title: this.title,
      status: this.status,
      detail: this.detail,
      ...(this.instance && { instance: this.instance }),
    };
  }
}

export function notFound(detail: string, instance?: string): AppError {
  return new AppError(404, "Not Found", detail, instance);
}

export function badRequest(detail: string, instance?: string): AppError {
  return new AppError(400, "Bad Request", detail, instance);
}

export function unauthorized(detail: string): AppError {
  return new AppError(401, "Unauthorized", detail);
}

export function tooManyRequests(detail: string): AppError {
  return new AppError(429, "Too Many Requests", detail);
}

export function errorHandler(err: Error, c: Context<AppEnv>): Response {
  if (err instanceof AppError) {
    return c.json(err.toJSON(), err.status);
  }
  return c.json(
    {
      type: "about:blank",
      title: "Internal Server Error",
      status: 500,
      detail: "An unexpected error occurred",
    },
    500
  );
}
