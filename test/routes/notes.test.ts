import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { notesRoutes } from "../../src/routes/notes.js";
import { errorHandler } from "../../src/errors.js";
import { MemoryStorage } from "../../src/storage/memory.js";
import type { AppEnv } from "../../src/types.js";

let storage: MemoryStorage;

function createApp() {
  storage = new MemoryStorage();
  const app = new Hono<AppEnv>();
  app.use(async (c, next) => {
    c.set("storage", storage);
    await next();
  });
  app.onError(errorHandler);
  app.route("/api/v1/notes", notesRoutes);
  return app;
}

describe("notes routes", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  describe("POST /api/v1/notes", () => {
    it("creates a note and returns 201", async () => {
      const res = await app.request("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test",
          content: "Body text",
          tags: ["demo"],
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBeTruthy();
      expect(body.title).toBe("Test");
      expect(body.tags).toEqual(["demo"]);
    });

    it("returns 400 for missing title", async () => {
      const res = await app.request("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Body" }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 for empty title", async () => {
      const res = await app.request("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", content: "Body" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/notes", () => {
    it("returns empty list when no notes exist", async () => {
      const res = await app.request("/api/v1/notes");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("returns created notes", async () => {
      await app.request("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "A", content: "Body A" }),
      });
      await app.request("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "B", content: "Body B" }),
      });

      const res = await app.request("/api/v1/notes");
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.items).toHaveLength(2);
    });

    it("supports pagination", async () => {
      for (let i = 0; i < 5; i++) {
        await app.request("/api/v1/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: `Note ${i}`, content: "Body" }),
        });
      }

      const res = await app.request("/api/v1/notes?limit=2&offset=2");
      const body = await res.json();
      expect(body.items).toHaveLength(2);
      expect(body.total).toBe(5);
      expect(body.limit).toBe(2);
      expect(body.offset).toBe(2);
    });

    it("filters by tag", async () => {
      await app.request("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "A", content: "Body", tags: ["go"] }),
      });
      await app.request("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "B", content: "Body", tags: ["ts"] }),
      });

      const res = await app.request("/api/v1/notes?tag=go");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.items[0].tags).toContain("go");
    });
  });

  describe("GET /api/v1/notes/:id", () => {
    it("returns a note by id", async () => {
      const createRes = await app.request("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Find Me", content: "Body" }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/v1/notes/${created.id}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.title).toBe("Find Me");
    });

    it("returns 404 for missing note", async () => {
      const res = await app.request("/api/v1/notes/nonexistent");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.title).toBe("Not Found");
    });
  });

  describe("PUT /api/v1/notes/:id", () => {
    it("updates a note", async () => {
      const createRes = await app.request("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Original", content: "Body" }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/v1/notes/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.title).toBe("Updated");
      expect(body.content).toBe("Body");
    });

    it("returns 404 for missing note", async () => {
      const res = await app.request("/api/v1/notes/nonexistent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nope" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/notes/:id", () => {
    it("deletes a note and returns 204", async () => {
      const createRes = await app.request("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Delete Me", content: "Body" }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/v1/notes/${created.id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(204);

      const getRes = await app.request(`/api/v1/notes/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it("returns 404 for missing note", async () => {
      const res = await app.request("/api/v1/notes/nonexistent", {
        method: "DELETE",
      });
      expect(res.status).toBe(404);
    });
  });
});
