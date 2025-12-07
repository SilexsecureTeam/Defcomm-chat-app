// services/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createTauriPersister } from "./queryPersistor";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // keep for 24 hours (tweak if you like)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      // add global mutation behavior if desired
    },
  },
});

/**
 * Initialize query persistence.
 * Call this once after you know the current userId (optional).
 *
 * Example: initQueryPersistence({ userId: authDetails?.user?.id })
 */
export function initQueryPersistence(opts) {
  const { userId, maxAge = 1000 * 60 * 60 * 24 } = opts;

  // Create a persister pointing to the user's store file
  const persister = createTauriPersister({ userId });

  // Optional: you can pass serialize/deserialize to tweak what gets saved
  // Here we don't override them (use defaults), but we will filter sensitive queries
  persistQueryClient({
    queryClient,
    persister,
    maxAge,
    // Optional: choose to serialize only queries you want by providing
    // custom serialize/deserialize. For most apps default is fine.
    // serialize: (client) => JSON.stringify(client),
    // deserialize: (str) => JSON.parse(str),
  });

  // NOTE: persistQueryClient will start persisting automatically.
}
