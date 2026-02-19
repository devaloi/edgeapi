import type { StorageAdapter, ListOptions, ListResult } from "./adapter.js";
import type {
  Note,
  CreateNoteInput,
  UpdateNoteInput,
} from "../schemas/note.js";

let counter = 0;

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const suffix = (++counter).toString(36).padStart(4, "0");
  return `${timestamp}-${suffix}`;
}

export class MemoryStorage implements StorageAdapter {
  private store = new Map<string, Note>();

  async get(id: string): Promise<Note | null> {
    return this.store.get(id) ?? null;
  }

  async list(options: ListOptions): Promise<ListResult> {
    let items = Array.from(this.store.values());

    if (options.tag) {
      items = items.filter((note) => note.tags.includes(options.tag!));
    }

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = items.length;
    items = items.slice(options.offset, options.offset + options.limit);

    return { items, total };
  }

  async create(data: CreateNoteInput): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = {
      id: generateId(),
      title: data.title,
      content: data.content,
      tags: data.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(note.id, note);
    return note;
  }

  async update(id: string, data: UpdateNoteInput): Promise<Note | null> {
    const existing = this.store.get(id);
    if (!existing) return null;

    const updated: Note = {
      ...existing,
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.tags !== undefined && { tags: data.tags }),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  clear(): void {
    this.store.clear();
  }
}
