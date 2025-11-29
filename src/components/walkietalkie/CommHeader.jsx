import { useContext, useEffect, useState } from "react";
import { CommContext } from "../../context/CommContext";
import {
  MdMarkChatUnread,
  MdPanTool,
  MdPowerSettingsNew,
  MdTouchApp,
} from "react-icons/md";
import VoiceModeModal from "./VoiceModeModal";
import useComm from "../../hooks/useComm";
import { FaSpinner } from "react-icons/fa";

const formatTime = (sec) => {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
};

const CommHeader = () => {
  const {
    isCommActive,
    connectingChannelId,
    activeChannel,
    leaveChannel,
    setShowCommLog,
    showCommLog,
    voiceMode,
  } = useContext(CommContext);
  const [seconds, setSeconds] = useState(0);
  const { subscriberLeave } = useComm();

  const [showVoiceModeModal, setShowVoiceModeModal] = useState(false);
  // Timer for connection time
  useEffect(() => {
    let timer;
    if (isCommActive && activeChannel && !connectingChannelId) {
      timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isCommActive, activeChannel, connectingChannelId]);

  return (
    <div className="bg-oliveHover w-full mt-6 px-3 py-2 rounded-3xl shadow-inner border border-black/30">
      {/* Top Controls */}
      <div className="flex items-center justify-between mb-2">
        {/* Voice Mode Toggle */}
        <button
          className="bg-black/30 p-2 rounded-full hover:bg-black/50 border border-black/50 shadow-lg transition-all duration-150 active:scale-95"
          onClick={() => setShowVoiceModeModal(true)}
          title={voiceMode === "tap" ? "Tap to Record" : "Hold to Talk"}
        >
          {voiceMode === "tap" ? (
            <MdTouchApp size={20} className="text-lightGreen" />
          ) : (
            <MdPanTool size={20} className="text-lightGreen" />
          )}
        </button>

        {/* End Button */}
        <button
          onClick={leaveChannel}
          disabled={subscriberLeave.isPending}
          className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1 font-bold tracking-wide uppercase border border-red-900 transition-all duration-150 active:scale-95"
        >
          {subscriberLeave.isPending ? (
            <FaSpinner className="text-base animate-spin" />
          ) : (
            <MdPowerSettingsNew className="text-base" />
          )}{" "}
          Leave
        </button>
      </div>

      {/* Channel Info Bar */}
      <div className="flex items-center justify-between gap-2 bg-lightGreen text-black p-2 rounded-md border border-black/20 shadow-inner">
        <span className="font-bold flex items-center gap-2 uppercase tracking-wide text-xs">
          <MdMarkChatUnread
            onClick={() => setShowCommLog(!showCommLog)}
            size={18}
            className="cursor-pointer hover:scale-110 transition-transform"
          />
          {activeChannel?.name}
        </span>
        <span className="font-mono text-sm">{formatTime(seconds)}</span>
      </div>

      {showVoiceModeModal && (
        <VoiceModeModal
          isOpen={showVoiceModeModal}
          onClose={() => setShowVoiceModeModal(false)}
        />
      )}
    </div>
  );
};

export default CommHeader;
