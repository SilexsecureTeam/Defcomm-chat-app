import { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { emit } from "@tauri-apps/api/event";
import { AuthContext } from "../context/AuthContext";
import FallBack from "../components/Fallback";

const RootRedirect = () => {
  const { authDetails, isLoading } = useContext(AuthContext);

  // ✅ Emit only once when loading completes
  useEffect(() => {
    if (!isLoading) {
      emit("frontend-ready");
      console.log("✅ frontend-ready emitted from RootRedirect");
    }
  }, [isLoading]);

  // Show fallback (splash still visible) while auth state loads
  if (isLoading) return <FallBack />;

  // After ready, route user appropriately
  return authDetails ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default RootRedirect;
