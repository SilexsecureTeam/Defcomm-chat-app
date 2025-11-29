import { createContext, useEffect, useState } from "react";
import { useAppStore } from "./StoreContext";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { get, set, remove, clear } = useAppStore();
  const [authDetails, setAuthDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedUser = await get("authUser");
        if (savedUser) {
          console.log("Restored user:", savedUser);
          setAuthDetails(savedUser);
        }
      } catch (err) {
        console.error("Failed to load auth:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [get]);

  const updateAuth = async (user) => {
    try {
      if (user) {
        await set("authUser", user);
        setAuthDetails(user);
      } else {
        await remove("authUser");
        setAuthDetails(null);
      }
    } catch (err) {
      console.error("Failed to update auth store:", err);
    }
  };

  const logout = async () => {
    await clear();
    setAuthDetails(null);
  };

  return (
    <AuthContext.Provider
      value={{ authDetails, updateAuth, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
