import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { MemoryStorage } from "../src/storage/memory.js";

const API_KEY = "test-key";

function setup() {
  const storage = new MemoryStorage();
  const app = createApp({ storage, apiKey: API_KEY });
  return { app, storage };
}

function authHeader() {
  return { Authorization: `Bearer ${API_KEY}` };
}

describe("integration: full API flow", () => {
  let app: ReturnType<typeof setup>["app"];

  beforeEach(() => {
    ({ app } = setup());
  });

  it("health endpoint is publicly accessible", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("ready endpoint is publicly accessible", async () => {
    const res = await app.request("/ready");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ready");
  });

  it("rejects unauthenticated API requests", async () => {
    const res = await app.request("/api/v1/notes");
    expect(res.status).toBe(401);
  });

  it("full CRUD lifecycle for notes", async () => {
    const createRes = await app.request("/api/v1/notes", {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Integration Test",
        content: "Testing the full flow",
        tags: ["test", "integration"],
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.id).toBeTruthy();
    expect(created.title).toBe("Integration Test");

    const getRes = await app.request(`/api/v1/notes/${created.id}`, {
      headers: authHeader(),
    });
    expect(getRes.status).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.title).toBe("Integration Test");

    const listRes = await app.request("/api/v1/notes", {
      headers: authHeader(),
    });
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list.total).toBe(1);

    const updateRes = await app.request(`/api/v1/notes/${created.id}`, {
      method: "PUT",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.title).toBe("Updated Title");
    expect(updated.content).toBe("Testing the full flow");

    const deleteRes = await app.request(`/api/v1/notes/${created.id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    expect(deleteRes.status).toBe(204);

    const missingRes = await app.request(`/api/v1/notes/${created.id}`, {
      headers: authHeader(),
    });
    expect(missingRes.status).toBe(404);
  });

  it("returns validation errors for invalid input", async () => {
    const res = await app.request("/api/v1/notes", {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.title).toBe("Bad Request");
  });

  it("includes request id in all responses", async () => {
    const res = await app.request("/health");
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("includes rate limit headers", async () => {
    const res = await app.request("/health");
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy();
    expect(res.headers.get("X-RateLimit-Remaining")).toBeTruthy();
  });

  it("filters notes by tag", async () => {
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Go Note",
        content: "About Go",
        tags: ["go"],
      }),
    });
    await app.request("/api/v1/notes", {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "TS Note",
        content: "About TypeScript",
        tags: ["typescript"],
      }),
    });

    const res = await app.request("/api/v1/notes?tag=go", {
      headers: authHeader(),
    });
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].tags).toContain("go");
  });

  it("preserves request id when provided", async () => {
    const res = await app.request("/health", {
      headers: { "X-Request-Id": "my-trace-id" },
    });
    expect(res.headers.get("X-Request-Id")).toBe("my-trace-id");
  });
});
