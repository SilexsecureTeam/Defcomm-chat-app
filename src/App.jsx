import { Suspense, lazy, useEffect } from "react";
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
import { toast } from "react-toastify";

// Lazy load components
const DefcommLogin = lazy(() => import("./pages/DefcommLogin"));
const SecureRoute = lazy(() => import("./routes/SecureRoute"));
const Dashboard = lazy(() => import("./routes/DashboardRoute"));

const App = () => {
  useEffect(() => {
    let unlisten = null;

    const setupTauriEvents = async () => {
      try {
        if (await isTauri()) {
          const { listen } = await import("@tauri-apps/api/event");

          // Listen for long running thread events
          const cleanup = await listen("longRunningThread", ({ payload }) => {
            console.log("Long running thread event:", payload);
            // You can use console.log or implement your own logging
          });

          unlisten = cleanup;
        }
      } catch (err) {
        console.error("Failed to setup Tauri events:", err);
      }
    };

    setupTauriEvents();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  // Update checker - only runs in Tauri environment
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // Only check in Tauri environment
        if (!(await isTauri())) return;

        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();

        console.log("Update check result:", update);

        if (update?.available) {
          // Show update notification
          toast.info(
            <div className="p-2">
              <strong className="block text-lg mb-2">
                🚀 Update Available: v{update.version}
              </strong>
              <div className="mb-3 text-sm max-h-20 overflow-y-auto">
                {update.notes && (
                  <div dangerouslySetInnerHTML={{ __html: update.notes }} />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      toast.info("Downloading update...", { autoClose: false });
                      await update.downloadAndInstall();
                      toast.success("Update installed! App will restart...");
                    } catch (error) {
                      console.error("Update failed:", error);
                      toast.error("Update installation failed");
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                  Install & Restart
                </button>
                <button
                  onClick={() => toast.dismiss()}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Later
                </button>
              </div>
            </div>,
            {
              autoClose: false,
              closeOnClick: false,
              draggable: false,
              closeButton: false,
              position: "top-right",
              className: "!w-auto !max-w-md",
            }
          );
        } else {
          console.log("No updates available");
        }
      } catch (err) {
        console.error("Update check failed:", err);
        // Don't show error toast for failed update checks
      }
    };

    // Check for updates after a short delay
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    // Optional: Check for updates periodically (every 24 hours)
    const interval = setInterval(() => {
      checkForUpdates();
    }, 24 * 60 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
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
                        autoClose={5000}
                        hideProgressBar={false}
                        newestOnTop
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
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
  );
};

export default App;
