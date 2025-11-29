// DashBoardRoute.jsx
import { lazy, Suspense, useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Fallback from "../components/Fallback";
import { ThemeProvider } from "../context/ThemeContext";
import DashboardLayout from "../layout/DashboardLayout";
import withSubscription from "../hocs/withSubscription";

// Lazy pages
const DashboardWrapper = lazy(() => import("../layout/DashboardWrapper"));
const SecureChatUI = lazy(() => import("../pages/SecureChatUI"));
const SecureGroupChat = lazy(() => import("../pages/SecureGroupChat"));
const WalkieTalkie = lazy(() => import("../pages/WalkieTalkie"));

export default function DashBoardRoute() {
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
