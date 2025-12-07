// DashBoardRoute.jsx
import { lazy, Suspense, useContext, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Fallback from "../components/Fallback";
import { ThemeProvider } from "../context/ThemeContext";
import DashboardLayout from "../layout/DashboardLayout";
import withSubscription from "../hocs/withSubscription";
import { useAppStore } from "../context/StoreContext";
import { AuthContext } from "../context/AuthContext";
import { initQueryPersistence } from "../services/query-client";

// Lazy pages
const DashboardWrapper = lazy(() => import("../layout/DashboardWrapper"));
const SecureChatUI = lazy(() => import("../pages/SecureChatUI"));
const SecureGroupChat = lazy(() => import("../pages/SecureGroupChat"));
const WalkieTalkie = lazy(() => import("../pages/WalkieTalkie"));

export default function DashBoardRoute() {
  const { get } = useAppStore();
  const { authDetails } = useContext(AuthContext);
  useEffect(() => {
    let mounted = true;

    // if you have userId, pass it so persistence is per-user
    const userId = authDetails?.user?.id ?? undefined;

    // init persistence once
    initQueryPersistence({ userId });

    // optionally seed anything else (not needed, persistQueryClient already restores)
    return () => {
      mounted = false;
    };
  }, [authDetails?.user?.id]);

  const ProtectedChat = withSubscription(SecureChatUI, "enable_chat");
  const ProtectedGroupChat = withSubscription(SecureGroupChat, "enable_chat");
  const ProtectedWalkie = withSubscription(WalkieTalkie, "enable_walkie");

  return (
    <ThemeProvider>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<DashboardWrapper />}>
            {/* Dashboard Shell (Always Active) */}
            <Route element={<DashboardLayout />}>
              {/* Default view */}
              <Route index element={<ProtectedChat />} />

              {/* Chat Routes */}
              <Route path="user/:userId/chat" element={<ProtectedChat />} />
              <Route
                path="group/:groupId/chat"
                element={<ProtectedGroupChat />}
              />

              {/* Walkie Talkie */}
              <Route path="comm" element={<ProtectedWalkie />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
