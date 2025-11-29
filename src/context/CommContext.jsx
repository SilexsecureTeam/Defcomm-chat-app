import { createContext, useState, useEffect } from "react";
import useComm from "../hooks/useComm";

export const CommContext = createContext();

export const CommProvider = ({ children }) => {
  const [activeChannel, setActiveChannel] = useState(null);
  const [isCommActive, setIsCommActive] = useState(false);
  const [connectingChannelId, setConnectingChannelId] = useState(null);
  const [isOpenComm, setIsOpenComm] = useState(false);

  const { subscriberLeave } = useComm();

  // Store walkie-talkie messages
  const [walkieMessages, setWalkieMessages] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [showCommLog, setShowCommLog] = useState(false);

  // Voice mode: "tap" or "hold"
  const [voiceMode, setVoiceMode] = useState(() => {
    // Load from storage on init
    return localStorage.getItem("voiceMode") || "hold";
  });

  // Persist voiceMode whenever it changes
  useEffect(() => {
    localStorage.setItem("voiceMode", voiceMode);
  }, [voiceMode]);

  // 🆕 Renamed liveSpeaker -> currentSpeaker
  const [currentSpeaker, setCurrentSpeaker] = useState(null);

  // Function to leave the current channel
  const leaveChannel = (action) => {
    subscriberLeave.mutate(
      { channel_id: activeChannel?.channel_id },
      {
        onSuccess: () => {
          setIsCommActive(false);
          setActiveChannel(null);
          setCurrentSpeaker(null);
          setConnectingChannelId(null);
          setWalkieMessages([]);
          setRecentMessages([]);
          setIsOpenComm(false);
          setShowCommLog(false);
        },
      }
    );
  };

  return (
    <CommContext.Provider
      value={{
        activeChannel,
        setActiveChannel,
        isCommActive,
        setIsCommActive,
        connectingChannelId,
        setConnectingChannelId,
        isOpenComm,
        setIsOpenComm,
        walkieMessages,
        setWalkieMessages,
        recentMessages,
        setRecentMessages,
        currentSpeaker,
        setCurrentSpeaker,
        leaveChannel,
        showCommLog,
        setShowCommLog,
        voiceMode,
        setVoiceMode,
      }}
    >
      {children}
    </CommContext.Provider>
  );
};
