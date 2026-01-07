import { Suspense, lazy, useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { queryClient } from "./services/query-client";
import { createTauriPersister } from "./services/queryPersistor";

import { StoreProvider, useAppStore } from "./context/StoreContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatProvider } from "./context/ChatContext";
import { GroupProvider } from "./context/GroupContext";
import { CommProvider } from "./context/CommContext";
import { MeetingProvider } from "./context/MeetingContext";
import { DashboardContextProvider } from "./context/DashboardContext";
import NetworkStatusBanner from "./components/NetworkStatusBanner";

import TitleBar from "./layout/TitleBar";
import RootRedirect from "./routes/RootRedirect";
import ForcedUpdateModal from "./utils/ForcedUpdateModal";
import FallBack from "./components/Fallback";

import { isTauri } from "@tauri-apps/api/core";
import { useIsRestoring } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

// Lazy load components
const DefcommLogin = lazy(() => import("./pages/DefcommLogin"));
const SecureRoute = lazy(() => import("./routes/SecureRoute"));
const Dashboard = lazy(() => import("./routes/DashboardRoute"));

/**
 * Inner App that is wrapped by StoreProvider
 * Ensures useAppStore() is called after provider is available
 */
const AppInner = () => {
  const { get } = useAppStore();
  const [userId, setUserId] = useState(null);
  const [forcedUpdate, setForcedUpdate] = useState(null);
  const [bypassed, setBypassed] = useState(false);

  // Fetch saved user from Store
  useEffect(() => {
    const fetchUser = async () => {
      const savedUser = await get("authUser");
      setUserId(savedUser?.user?.id || null);
    };
    fetchUser();
  }, [get]);

  // Tauri updater check
  useEffect(() => {
    const checkUpdate = async () => {
      if (!(await isTauri())) return;

      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (update?.available) {
          const releaseDate = new Date(update.date).getTime();
          const graceDays = import.meta.env.VITE_UPDATE_GRACE_DAYS || 3; // fallback 3 days
          const deadline = releaseDate + graceDays * 24 * 60 * 60 * 1000;

          setForcedUpdate({
            version: update.version,
            notes: update.body || update.rawJson?.notes,
            deadline,
          });
        }
      } catch (err) {
        console.error("Tauri update check failed:", err);
      }
    };

    checkUpdate();
  }, []);

  const isExpired = forcedUpdate && Date.now() >= forcedUpdate.deadline;

  // Wait for userId before creating persister
  if (!userId) return <div>Loading user data...</div>;

  const persister = createTauriPersister({ userId });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      {/* Wait for query cache to restore */}
      <PersistedApp
        forcedUpdate={forcedUpdate}
        isExpired={isExpired}
        setBypassed={setBypassed}
      />
    </PersistQueryClientProvider>
  );
};

/**
 * Component that renders the main UI after React Query cache is restored
 */
const PersistedApp = ({ forcedUpdate, isExpired, setBypassed }) => {
  const isRestoring = useIsRestoring();

  if (isRestoring) return <div>Loading cached data...</div>;

  return (
    <>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <GroupProvider>
              <CommProvider>
                <MeetingProvider>
                  <DashboardContextProvider>
                    <TitleBar />
                    <Suspense fallback={<FallBack />}>
                      <Router>
                        <Routes>
                          <Route path="/" element={<RootRedirect />} />
                          <Route path="/login" element={<DefcommLogin />} />
                          <Route path="/dashboard/*" element={<SecureRoute />}>
                            <Route path="*" element={<Dashboard />} />
                          </Route>
                          <Route
                            path="*"
                            element={<Navigate to="/" replace />}
                          />
                        </Routes>
                      </Router>
                    </Suspense>
                    <ToastContainer
                      position="top-right"
                      newestOnTop
                      theme="colored"
                      className="z-[10000] mt-10"
                    />
                    <NetworkStatusBanner />
                  </DashboardContextProvider>
                </MeetingProvider>
              </CommProvider>
            </GroupProvider>
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>

      {/* Overlay AFTER app renders */}
      {forcedUpdate && (!bypassed || isExpired) && (
        <ForcedUpdateModal
          version={forcedUpdate.version}
          notes={forcedUpdate.notes}
          deadline={forcedUpdate.deadline}
          isExpired={isExpired}
          onBypass={() => setBypassed(true)}
        />
      )}
    </>
  );
};

/**
 * Root App
 * Provides StoreProvider first
 */
const App = () => (
  <StoreProvider>
    <AppInner />
  </StoreProvider>
);

export default App;
