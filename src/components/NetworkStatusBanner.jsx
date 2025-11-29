import { motion, AnimatePresence } from "framer-motion";
import { MdCloudOff, MdCloudDone } from "react-icons/md";
import { Online, Offline } from "react-detect-offline";
import { useState, useEffect, useRef } from "react";

export default function NetworkStatusBanner() {
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const wasOffline = useRef(false);

  // Hide online banner after 2s
  useEffect(() => {
    if (showOnlineBanner) {
      const timer = setTimeout(() => setShowOnlineBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showOnlineBanner]);

  return (
    <>
      {/* 🔴 OFFLINE BANNER */}
      <Offline>
        <AnimatePresence>
          <motion.div
            key="offline-banner"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 18 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white font-medium text-sm shadow-md flex items-center gap-2 z-[9999] bg-red-600"
          >
            <MdCloudOff size={22} />
            You're offline
          </motion.div>
        </AnimatePresence>
      </Offline>

      {/* 🟢 ONLINE BANNER */}
      <Online
        onChange={(online) => {
          if (online && wasOffline.current) {
            setShowOnlineBanner(true);
            wasOffline.current = false;
          } else if (!online) {
            wasOffline.current = true;
          }
        }}
      >
        <AnimatePresence>
          {showOnlineBanner && (
            <motion.div
              key="online-banner"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 18 }}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white font-medium text-sm shadow-md flex items-center gap-2 z-[9999] bg-green-600"
            >
              <MdCloudDone size={22} />
              Back online
            </motion.div>
          )}
        </AnimatePresence>
      </Online>
    </>
  );
}
