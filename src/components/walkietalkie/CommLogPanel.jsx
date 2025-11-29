import { useContext, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdExpandLess, MdExpandMore } from "react-icons/md";
import { CommContext } from "../../context/CommContext";
import { AuthContext } from "../../context/AuthContext";
import AudioVisualizer from "../charts/AudioVisualizer";
import { useRadioHiss } from "../../utils/walkie-talkie/useRadioHiss";
import CommLogList from "./CommLogList";
import CommLogFull from "./CommLogFull";

const CommLogPanel = () => {
  const { walkieMessages, showCommLog, setShowCommLog } =
    useContext(CommContext);
  const { authDetails } = useContext(AuthContext);
  const currentUserId = authDetails?.user?.id;
  const { startRadioHiss, stopRadioHiss } = useRadioHiss(0.01);

  const [expanded, setExpanded] = useState(false);
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const [alertUser, setAlertUser] = useState(null);
  const [isPlayingId, setIsPlayingId] = useState(null);

  const logEndRef = useRef(null);
  const lastMsgCount = useRef(0);
  const audioRef = useRef(null);

  // Auto-scroll when expanded or modal open
  useEffect(() => {
    if (expanded || showCommLog) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [walkieMessages, expanded, showCommLog]);

  // Detect new message
  useEffect(() => {
    if (walkieMessages.length > lastMsgCount.current) {
      const latest = walkieMessages[walkieMessages.length - 1];
      const rawName = latest.display_name || latest.user_name || "Unknown";

      // Safely extract first name if there's more than one word
      const nameParts = rawName.trim().split(" ");
      const firstName = nameParts.length > 1 ? nameParts[0] : rawName; // use whole name if already one word
      const alertMessage =
        latest.type === "join"
          ? `${firstName} joined`
          : latest.type === "leave"
          ? `${firstName} left`
          : latest.type === "voice"
          ? `${firstName} sent a recording`
          : `Activity from ${firstName}`;

      setAlertUser(alertMessage);
      setNewMessageAlert(true);
    }

    lastMsgCount.current = walkieMessages.length;
  }, [walkieMessages, showCommLog, currentUserId]);

  // Play / Pause audio
  const handlePlayPause = (msg, index) => {
    if (!msg.record) return;

    if (isPlayingId === index) {
      audioRef.current.pause();
      stopRadioHiss();
      setIsPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      stopRadioHiss();
    }

    const audio = new Audio(`${import.meta.env.VITE_BASE_URL}${msg.record}`);
    audioRef.current = audio;
    setIsPlayingId(index);

    startRadioHiss();
    audio.play();

    audio.onended = () => {
      stopRadioHiss();
      setIsPlayingId(null);
      audioRef.current = null;
    };
  };

  return (
    <>
      {/* Main Panel */}
      <div className="w-full mb-3 rounded-lg border border-lime-500/40 overflow-hidden backdrop-blur-lg bg-black/40 shadow-[0_0_20px_rgba(0,255,0,0.15)]">
        {/* Header */}
        <div
          onClick={() => setExpanded(!expanded)}
          className={`cursor-pointer flex justify-between items-center px-3 py-1 border-b border-lime-500/30 ${
            newMessageAlert
              ? "bg-lime-900/50 animate-pulse"
              : "bg-gradient-to-r from-lime-800/50 to-lime-900/50"
          }`}
        >
          <span className="text-xs text-lime-300 tracking-wide font-mono cursor-pointer">
            COMMS LOG ({walkieMessages.length})
          </span>

          <div className="flex items-center gap-2">
            {/* Expand/Collapse Panel */}
            {expanded ? (
              <MdExpandLess
                className="text-lime-300 cursor-pointer"
                onClick={() => setExpanded(false)}
              />
            ) : (
              <MdExpandMore
                className="text-lime-300 cursor-pointer"
                onClick={() => setExpanded(true)}
              />
            )}
          </div>
        </div>

        {/* Visualizer */}
        <div className="p-2 flex justify-center bg-black/10 relative overflow-hidden">
          <AudioVisualizer
            audioRef={audioRef}
            width={250}
            height={50}
            fillColor={newMessageAlert ? "#9acd32" : "#7fff00"}
            strokeColor="rgba(0,255,0,0.2)"
          />

          {/* HUD alert name */}
          <AnimatePresence>
            {alertUser && !expanded && !showCommLog && (
              <motion.span
                key={alertUser}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.9, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-x-0 top-1/4 -translate-y-1/2 text-center 
                           text-lime-300 font-bold text-sm tracking-widest pointer-events-none 
                           drop-shadow-[0_0_4px_rgba(144,238,144,0.6)]"
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              >
                {alertUser.toUpperCase()}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Collapsible Logs */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="logList"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "200px", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-y-auto px-3 py-2 text-xs space-y-2"
            >
              {walkieMessages.length === 0 ? (
                <p className="text-gray-400 italic">Awaiting transmission...</p>
              ) : (
                <CommLogList
                  walkieMessages={walkieMessages}
                  isPlayingId={isPlayingId}
                  handlePlayPause={handlePlayPause}
                  audioRef={audioRef}
                  logEndRef={logEndRef}
                />
              )}
              <div ref={logEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Modal */}
      {showCommLog && (
        <CommLogFull
          isPlayingId={isPlayingId}
          handlePlayPause={handlePlayPause}
          audioRef={audioRef}
          logEndRef={logEndRef}
        />
      )}
    </>
  );
};

export default CommLogPanel;
