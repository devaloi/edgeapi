import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStorage } from "../../src/storage/memory.js";

describe("MemoryStorage", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  describe("create", () => {
    it("creates a note with generated id and timestamps", async () => {
      const note = await storage.create({
        title: "Test Note",
        content: "Hello world",
        tags: ["test"],
      });

      expect(note.id).toBeTruthy();
      expect(note.title).toBe("Test Note");
      expect(note.content).toBe("Hello world");
      expect(note.tags).toEqual(["test"]);
      expect(note.createdAt).toBeTruthy();
      expect(note.updatedAt).toBe(note.createdAt);
    });

    it("defaults tags to empty array", async () => {
      const note = await storage.create({
        title: "No Tags",
        content: "Body",
        tags: [],
      });
      expect(note.tags).toEqual([]);
    });
  });

  describe("get", () => {
    it("returns a note by id", async () => {
      const created = await storage.create({
        title: "Find Me",
        content: "Body",
        tags: [],
      });
      const found = await storage.get(created.id);
      expect(found).toEqual(created);
    });

    it("returns null for missing id", async () => {
      const found = await storage.get("nonexistent");
      expect(found).toBeNull();
    });
  });

  describe("list", () => {
    it("returns all notes", async () => {
      await storage.create({ title: "First", content: "A", tags: [] });
      await storage.create({ title: "Second", content: "B", tags: [] });
      await storage.create({ title: "Third", content: "C", tags: [] });

      const result = await storage.list({ limit: 10, offset: 0 });
      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(3);
      const titles = result.items.map((n) => n.title);
      expect(titles).toContain("First");
      expect(titles).toContain("Second");
      expect(titles).toContain("Third");
    });

    it("paginates with limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        await storage.create({ title: `Note ${i}`, content: "Body", tags: [] });
      }

      const page = await storage.list({ limit: 2, offset: 2 });
      expect(page.items).toHaveLength(2);
      expect(page.total).toBe(5);
    });

    it("filters by tag", async () => {
      await storage.create({ title: "A", content: "Body", tags: ["go"] });
      await storage.create({ title: "B", content: "Body", tags: ["ts"] });
      await storage.create({ title: "C", content: "Body", tags: ["go", "ts"] });

      const result = await storage.list({ limit: 10, offset: 0, tag: "go" });
      expect(result.total).toBe(2);
    });
  });

  describe("update", () => {
    it("updates specified fields", async () => {
      const created = await storage.create({
        title: "Original",
        content: "Body",
        tags: ["old"],
      });
      await new Promise((r) => setTimeout(r, 10));
      const updated = await storage.update(created.id, { title: "Updated" });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("Updated");
      expect(updated!.content).toBe("Body");
      expect(updated!.tags).toEqual(["old"]);
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.createdAt).getTime()
      );
    });

    it("returns null for missing id", async () => {
      const result = await storage.update("missing", { title: "Nope" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes an existing note", async () => {
      const created = await storage.create({
        title: "Delete Me",
        content: "Body",
        tags: [],
      });
      const deleted = await storage.delete(created.id);
      expect(deleted).toBe(true);

      const found = await storage.get(created.id);
      expect(found).toBeNull();
    });

    it("returns false for missing id", async () => {
      const deleted = await storage.delete("missing");
      expect(deleted).toBe(false);
    });
  });
});
