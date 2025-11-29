import React, { useContext } from "react";
import { CommContext } from "../../context/CommContext";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose } from "react-icons/md";

const VoiceModeModal = ({ isOpen, onClose }) => {
  const { voiceMode, setVoiceMode } = useContext(CommContext);

  const handleSelect = (mode) => {
    setVoiceMode(mode);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div
              className="relative bg-gray-900 text-white rounded-2xl w-[90%] max-w-sm p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                onClick={onClose}
              >
                <MdClose size={20} />
              </button>

              <h2 className="text-xl font-bold mb-4">Select Voice Mode</h2>

              <div className="space-y-3">
                <button
                  onClick={() => handleSelect("tap")}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition ${
                    voiceMode === "tap" ? "border-2 border-lime-400" : ""
                  }`}
                >
                  Tap to Record
                  <p className="text-xs text-gray-400 mt-1">
                    Tap once to start, tap again to stop.
                  </p>
                </button>

                <button
                  onClick={() => handleSelect("hold")}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition ${
                    voiceMode === "hold" ? "border-2 border-lime-400" : ""
                  }`}
                >
                  Hold to Talk
                  <p className="text-xs text-gray-400 mt-1">
                    Press and hold to record voice.
                  </p>
                </button>

                <button
                  onClick={onClose}
                  className="w-full text-sm text-gray-400 hover:text-white mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoiceModeModal;
