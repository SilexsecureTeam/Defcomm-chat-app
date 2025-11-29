import { createContext, useContext, useMemo } from "react";
import { LazyStore } from "@tauri-apps/plugin-store";

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  // ⚡ Lazy load the store only when first used
  const store = useMemo(() => new LazyStore("defcomm-data.json"), []);

  // Helper functions
  const get = async (key, fallback = null) => {
    try {
      const value = await store.get(key);
      return value ?? fallback;
    } catch (err) {
      console.error("Store get error:", err);
      return fallback;
    }
  };

  const set = async (key, value) => {
    try {
      await store.set(key, value);
      await store.save();
    } catch (err) {
      console.error("Store set error:", err);
    }
  };

  const remove = async (key) => {
    try {
      await store.delete(key);
      await store.save();
    } catch (err) {
      console.error("Store remove error:", err);
    }
  };

  const clear = async () => {
    try {
      await store.clear();
      await store.save();
    } catch (err) {
      console.error("Store clear error:", err);
    }
  };

  return (
    <StoreContext.Provider value={{ store, get, set, remove, clear }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useAppStore = () => useContext(StoreContext);
