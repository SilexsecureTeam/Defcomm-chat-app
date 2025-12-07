import { Suspense, lazy, useContext } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
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
import NetworkStatusBanner from "./components/NetworkStatusBanner";
import RootRedirect from "./routes/RootRedirect";

// Lazy load components
const DefcommLogin = lazy(() => import("./pages/DefcommLogin"));
const SecureRoute = lazy(() => import("./routes/SecureRoute"));
const Dashboard = lazy(() => import("./routes/DashboardRoute"));

const App = () => {
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
                            {/* Root path redirects based on auth */}
                            <Route path="/" element={<RootRedirect />} />
                            <Route path="/login" element={<DefcommLogin />} />
                            <Route
                              path="/dashboard/*"
                              element={<SecureRoute />}
                            >
                              <Route path="*" element={<Dashboard />} />
                            </Route>
                            {/* Fallback redirect */}
                            <Route
                              path="*"
                              element={<Navigate to="/" replace />}
                            />
                          </Routes>
                        </Router>
                      </Suspense>
                      {/* <NetworkStatusBanner /> */}
                      <ToastContainer
                        autoClose={2000}
                        draggable
                        className="z-[100000000000] mt-2"
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
