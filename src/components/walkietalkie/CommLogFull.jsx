import { motion, AnimatePresence } from "framer-motion";
import CommLogList from "./CommLogList";
import { useContext } from "react";
import { CommContext } from "../../context/CommContext";

const CommLogFull = ({ isPlayingId, handlePlayPause, audioRef, logEndRef }) => {
  const { walkieMessages, setShowCommLog, showCommLog } =
    useContext(CommContext);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[5000] flex flex-col max-w-3xl mx-auto"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 py-2 bg-lime-900/50 border-b border-lime-500/40">
          <span className="text-lime-300 font-mono text-sm">
            FULL COMMS LOG ({walkieMessages.length})
          </span>
          <button
            onClick={() => setShowCommLog(false)}
            className="text-lime-300 hover:text-white transition"
          >
            Close
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 text-xs space-y-2">
          <CommLogList
            walkieMessages={walkieMessages}
            isPlayingId={isPlayingId}
            handlePlayPause={handlePlayPause}
            audioRef={audioRef}
            logEndRef={logEndRef}
          />
          <div ref={logEndRef} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommLogFull;
