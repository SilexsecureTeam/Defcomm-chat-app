import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Chat/desktop/Sidebar";
import ChatList from "../components/Chat/desktop/ChatList";
import RightPanel from "../components/Chat/desktop/RightPanel";
import { toast } from "react-toastify";
import { useAppStore } from "../context/StoreContext"; // ✅ use the shared store

export default function DashboardLayout() {
  const location = useLocation();
  const { get, set, save } = useAppStore();
  const [showChatList, setShowChatList] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  const isChatPage =
    location.pathname === "/dashboard" || location.pathname.includes("/chat");

  // 🧠 Load persisted layout state from store
  useEffect(() => {
    (async () => {
      try {
        const lastChatList = await get("layout.showChatList");
        const lastRightPanel = await get("layout.showRightPanel");

        if (typeof lastChatList === "boolean") setShowChatList(lastChatList);
        if (typeof lastRightPanel === "boolean")
          setShowRightPanel(lastRightPanel);
      } catch (err) {
        console.error("Failed to load layout state:", err);
      }
    })();
  }, [get]);

  // 💾 Persist layout state when it changes
  useEffect(() => {
    (async () => {
      try {
        await set("layout.showChatList", showChatList);
        await set("layout.showRightPanel", showRightPanel);
      } catch (err) {
        console.error("Failed to save layout state:", err);
      }
    })();
  }, [set, showChatList, showRightPanel]);

  // 🧱 Restrict call actions (can’t call outside chat)
  const handleCallAction = (actionId) => {
    const onChatPage = location.pathname.includes("/chat");
    if ((actionId === "call" || actionId === "video") && !onChatPage) {
      toast.info("Please open a chat before starting a call.");
      return;
    }
  };

  return (
    <div
      className="flex h-full text-white relative"
      style={{
        background: `linear-gradient(to bottom, #36460A 10%, #000000 40%)`,
      }}
    >
      {/* Sidebar */}
      <Sidebar
        onMessageClick={() => setShowChatList(true)}
        onActionClick={handleCallAction}
        showChatList={showChatList}
      />

      {/* Desktop ChatList */}
      {isChatPage && (
        <div className="h-full hidden md:flex">
          <ChatList />
        </div>
      )}

      {/* Mobile ChatList */}
      <AnimatePresence>
        {showChatList && isChatPage && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed inset-y-0 left-0 bg-oliveDark/95 z-50 p-4 md:hidden h-full flex flex-col shadow-lg shadow-black/40"
          >
            <div className="flex justify-between items-center mt-8 mb-2">
              <h2 className="text-lg font-semibold"></h2>
              <button
                onClick={() => setShowChatList(false)}
                className="text-gray-300 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
            <div className="flex-1 h-full overflow-y-auto">
              <ChatList />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full">
        <Outlet context={{ setShowRightPanel }} />
      </div>

      {/* Right panel */}
      {isChatPage && (
        <div className="hidden lg:block">
          <RightPanel />
        </div>
      )}

      {/* Mobile Right Panel */}
      <AnimatePresence>
        {showRightPanel && isChatPage && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed inset-y-0 right-0 bg-black/95 z-50 p-4 lg:hidden shadow-lg shadow-black/40"
          >
            <div className="flex justify-between items-center mt-8 mb-2">
              <h2 className="text-lg font-semibold">Details</h2>
              <button
                onClick={() => setShowRightPanel(false)}
                className="text-gray-300 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
            <RightPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
