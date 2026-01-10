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

// Lazy-loaded routes
const DefcommLogin = lazy(() => import("./pages/DefcommLogin"));
const SecureRoute = lazy(() => import("./routes/SecureRoute"));
const Dashboard = lazy(() => import("./routes/DashboardRoute"));

const AppInner = () => {
  const { get } = useAppStore();

  const [userId, setUserId] = useState(undefined); // undefined = loading
  const [forcedUpdate, setForcedUpdate] = useState(null);
  const [bypassed, setBypassed] = useState(false);
  const [appReady, setAppReady] = useState(false);

  /* ---- Load stored auth user ---- */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const savedUser = await get("authUser");
        setUserId(savedUser?.user?.id || null);
      } catch (err) {
        console.error("Failed to load auth user:", err);
        setUserId(null);
      }
    };
    fetchUser();
  }, [get]);

  /* ---- Tauri updater ---- */
  useEffect(() => {
    const checkUpdate = async () => {
      if (!(await isTauri())) return;

      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        console.log("Tauri update check result:", update);
        if (update?.available) {
          const releaseDate = new Date(update.date).getTime();
          const graceDays = Number(import.meta.env.VITE_UPDATE_GRACE_DAYS) || 3;

          setForcedUpdate({
            version: update.version,
            notes: update.body || update.rawJson?.notes,
            deadline: releaseDate + graceDays * 24 * 60 * 60 * 1000,
          });
        }
      } catch (err) {
        console.error("Tauri update check failed:", err);
      }
    };

    checkUpdate();
  }, []);

  useEffect(() => {
    setAppReady(true);

    async function initLogging() {
      // Guard: only run inside Tauri
      const { isTauri } = await import("@tauri-apps/api/core");
      if (!(await isTauri())) return;

      // Dynamic import — THIS is the fix
      const loggers = await import("@tauri-apps/plugin-log");

      const { trace, error } = loggers;

      function forwardConsole(fn, logger) {
        const original = console[fn];

        console[fn] = (...args) => {
          original(...args);
          Promise.resolve().then(() => {
            try {
              logger(args.map(String).join(" "));
            } catch {}
          });
        };
      }

      forwardConsole("error", error);
      forwardConsole("warn", trace);
      forwardConsole("info", trace);
      forwardConsole("debug", trace);
      forwardConsole("log", trace);

      window.addEventListener("error", (event) => {
        Promise.resolve().then(() => {
          error(
            `Unhandled error: ${event.message}\n${event.error?.stack ?? ""}`
          );
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        Promise.resolve().then(() => {
          error(`Unhandled promise rejection: ${String(event.reason)}`);
        });
      });
    }
    initLogging();
  }, []);

  const isExpired = forcedUpdate && Date.now() >= forcedUpdate.deadline;

  /* ---- HARD GUARD: wait for userId ---- */
  if (userId === undefined) {
    return <FallBack />;
  }

  const persister = createTauriPersister({ userId });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24h
      }}
    >
      <PersistedApp />

      {/* Forced update overlay (AFTER app is ready) */}
      {appReady && forcedUpdate && (!bypassed || isExpired) && (
        <ForcedUpdateModal
          version={forcedUpdate.version}
          notes={forcedUpdate.notes}
          deadline={forcedUpdate.deadline}
          isExpired={isExpired}
          onBypass={() => setBypassed(true)}
        />
      )}
    </PersistQueryClientProvider>
  );
};

const PersistedApp = () => {
  const isRestoring = useIsRestoring();

  if (isRestoring) {
    return <FallBack />;
  }

  return (
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
                        <Route path="*" element={<Navigate to="/" replace />} />
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
  );
};

const App = () => (
  <StoreProvider>
    <AppInner />
  </StoreProvider>
);

export default App;
