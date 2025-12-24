import { Suspense, lazy, useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FallBack from "./components/Fallback";
import { DashboardContextProvider } from "./context/DashboardContext";
import { queryClient } from "./services/query-client";
import { ChatProvider } from "./context/ChatContext";
import { MeetingProvider } from "./context/MeetingContext";
import { NotificationProvider } from "./context/NotificationContext";
import { GroupProvider } from "./context/GroupContext";
import { CommProvider } from "./context/CommContext";
import { StoreProvider } from "./context/StoreContext";
import TitleBar from "./layout/TitleBar";
import RootRedirect from "./routes/RootRedirect";
import { isTauri } from "@tauri-apps/api/core";
import ForcedUpdateModal from "./utils/ForcedUpdateModal";

// Lazy load components
const DefcommLogin = lazy(() => import("./pages/DefcommLogin"));
const SecureRoute = lazy(() => import("./routes/SecureRoute"));
const Dashboard = lazy(() => import("./routes/DashboardRoute"));

const App = () => {
  const [forcedUpdate, setForcedUpdate] = useState(null);
  const [bypassed, setBypassed] = useState(false);

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

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <StoreProvider>
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
                              <Route
                                path="/dashboard/*"
                                element={<SecureRoute />}
                              >
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
                      </DashboardContextProvider>
                    </MeetingProvider>
                  </CommProvider>
                </GroupProvider>
              </ChatProvider>
            </NotificationProvider>
          </AuthProvider>
        </StoreProvider>
      </QueryClientProvider>

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

export default App;
