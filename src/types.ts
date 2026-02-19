import type { StorageAdapter } from "./storage/adapter.js";

export type AppEnv = {
  Variables: {
    requestId: string;
    storage: StorageAdapter;
  };
};
