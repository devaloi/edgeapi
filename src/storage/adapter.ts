import type { Note, CreateNoteInput, UpdateNoteInput } from "../schemas/note.js";

export interface ListOptions {
  limit: number;
  offset: number;
  tag?: string;
}

export interface ListResult {
  items: Note[];
  total: number;
}

export interface StorageAdapter {
  get(id: string): Promise<Note | null>;
  list(options: ListOptions): Promise<ListResult>;
  create(data: CreateNoteInput): Promise<Note>;
  update(id: string, data: UpdateNoteInput): Promise<Note | null>;
  delete(id: string): Promise<boolean>;
}
