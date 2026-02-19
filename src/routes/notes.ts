import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import {
  createNoteSchema,
  updateNoteSchema,
  listNotesQuerySchema,
} from "../schemas/note.js";
import { notFound, badRequest } from "../errors.js";
import { ZodError } from "zod";

export const notesRoutes = new Hono<AppEnv>();

function formatZodError(err: ZodError): string {
  return err.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join("; ");
}

notesRoutes.get("/", async (c) => {
  const storage = c.get("storage");
  const raw = {
    limit: c.req.query("limit"),
    offset: c.req.query("offset"),
    tag: c.req.query("tag"),
  };

  let query;
  try {
    query = listNotesQuerySchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      throw badRequest(formatZodError(err));
    }
    throw err;
  }

  const result = await storage.list(query);
  return c.json({
    items: result.items,
    total: result.total,
    limit: query.limit,
    offset: query.offset,
  });
});

notesRoutes.post("/", async (c) => {
  const storage = c.get("storage");
  const body = await c.req.json();

  let data;
  try {
    data = createNoteSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      throw badRequest(formatZodError(err));
    }
    throw err;
  }

  const note = await storage.create(data);
  return c.json(note, 201);
});

notesRoutes.get("/:id", async (c) => {
  const storage = c.get("storage");
  const id = c.req.param("id");
  const note = await storage.get(id);

  if (!note) {
    throw notFound(`Note with id '${id}' not found`, `/api/v1/notes/${id}`);
  }

  return c.json(note);
});

notesRoutes.put("/:id", async (c) => {
  const storage = c.get("storage");
  const id = c.req.param("id");
  const body = await c.req.json();

  let data;
  try {
    data = updateNoteSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      throw badRequest(formatZodError(err));
    }
    throw err;
  }

  const note = await storage.update(id, data);
  if (!note) {
    throw notFound(`Note with id '${id}' not found`, `/api/v1/notes/${id}`);
  }

  return c.json(note);
});

notesRoutes.delete("/:id", async (c) => {
  const storage = c.get("storage");
  const id = c.req.param("id");
  const deleted = await storage.delete(id);

  if (!deleted) {
    throw notFound(`Note with id '${id}' not found`, `/api/v1/notes/${id}`);
  }

  return c.body(null, 204);
});
