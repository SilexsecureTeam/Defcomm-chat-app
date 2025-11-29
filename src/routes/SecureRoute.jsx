import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Fallback from "../components/Fallback";

const SecureRoute = () => {
  const { authDetails, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // 🕐 Still loading user from storage
  if (isLoading) return <Fallback />;

  // 🧍 Not logged in
  if (!authDetails) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🚫 Unauthorized role
  if (authDetails.user?.role !== "user") {
    return <Navigate to="/login" replace />;
  }

  // 🚦 Optional: check account status
  const status = authDetails.user?.status;
  if (status !== "active" && status !== "pending") {
    return <Navigate to="/login" replace />;
  }

  // ✅ Authenticated and allowed
  return <Outlet />;
};

export default SecureRoute;
