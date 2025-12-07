// services/queryPersistor.ts
import { LazyStore } from "@tauri-apps/plugin-store";
import type { Persister } from "@tanstack/react-query-persist-client";

export function createTauriPersister({
  userId,
}: { userId?: string } = {}): Persister {
  // per-user filename (fallback to a generic file when no userId)
  const filename = userId
    ? `defcomm-data-user-${userId}.json`
    : "defcomm-data.json";
  const store = new LazyStore(filename);

  return {
    // persistClient receives a serialized string (JSON) by default
    persistClient: async (client) => {
      try {
        await store.set("react-query-cache", client);
        await store.save();
      } catch (err) {
        console.error("persistClient error:", err);
      }
    },

    // restoreClient must return the serialized string (or undefined)
    restoreClient: async () => {
      try {
        const v = await store.get("react-query-cache");
        // Validate that v is a PersistedClient or undefined
        if (
          v &&
          typeof v === "object" &&
          "timestamp" in v &&
          "buster" in v &&
          "clientState" in v
        ) {
          return v as import("@tanstack/react-query-persist-client").PersistedClient;
        }
        return undefined;
      } catch (err) {
        console.warn("restoreClient error:", err);
        return undefined;
      }
    },

    removeClient: async () => {
      try {
        await store.delete("react-query-cache");
        await store.save();
      } catch (err) {
        console.warn("removeClient error:", err);
      }
    },
  };
}
