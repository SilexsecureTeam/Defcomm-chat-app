import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { MeetingContext } from "../context/MeetingContext";
import useChat from "../hooks/useChat";
import Modal from "../components/modal/Modal";
import CallComponent from "../components/video-sdk/CallComponent";
import Settings from "../pages/Settings";
import usePusherChannel from "../hooks/usePusherChannel";
import { FaPhone } from "react-icons/fa6";
import IncomingCallWidget from "../utils/IncomingCallWidget";
import audioController from "../utils/audioController";
import AddContactInterface from "../components/dashboard/AddContactInterface";
import useGroups from "../hooks/useGroup";
import useGroupChannels from "../hooks/useGroupChannel";
import { CommContext } from "../context/CommContext";
import useCommChannel from "../hooks/useCommChannel";
import { FiMic } from "react-icons/fi";
import CommInterface from "../components/walkietalkie/CommInterface";

const DashboardWrapper = () => {
  const { authDetails } = useContext(AuthContext);
  const { setProviderMeetingId } = useContext(MeetingContext);

  const { useFetchGroups } = useGroups();
  const { data: groups } = useFetchGroups();

  const {
    showCall,
    setShowCall,
    showSettings,
    setShowSettings,
    showContactModal,
    setShowContactModal,
    setCallMessage,
    setMeetingId,
    meetingId,
    setCallDuration,
  } = useContext(ChatContext);

  const {
    isOpenComm,
    setIsOpenComm,
    isCommActive,
    activeChannel,
    currentSpeaker,
  } = useContext(CommContext);

  // Group Channel
  useGroupChannels({
    token: authDetails?.access_token,
    groups,
  });

  // PUSHER LISTENER
  usePusherChannel({
    userId: authDetails?.user_enid,
    token: authDetails?.access_token,
  });

  // COMMUNICATION CHANNEL SETUP
  useCommChannel({
    channelId: activeChannel?.channel_id,
    token: authDetails?.access_token,
  });

  return (
    <main
      className="h-screen w-screen relative pt-10 overflow-hidden "
      style={{
        background: `linear-gradient(to bottom, #36460A 10%, #000000 40%)`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Outlet />
      {showCall && (
        <Modal
          isOpen={showCall}
          closeModal={() => {
            setShowCall(false);
            setCallMessage(null);
            setProviderMeetingId(null);
            setMeetingId(null);
            setCallDuration(0);
            audioController.stopRingtone();
          }}
          canMinimize={true}
          minimizedContent={
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-sm font-semibold flex items-center gap-2">
                <FaPhone /> Secure Call
              </span>
            </div>
          }
        >
          <CallComponent
            initialMeetingId={meetingId}
            setInitialMeetingId={setMeetingId}
          />
        </Modal>
      )}
      {showSettings && (
        <Modal
          isOpen={showSettings}
          closeModal={() => setShowSettings(false)}
          minimizedContent="Settings"
        >
          <Settings />
        </Modal>
      )}
      {showContactModal && (
        <Modal
          isOpen={showContactModal}
          closeModal={() => setShowContactModal(false)}
        >
          <AddContactInterface />
        </Modal>
      )}
      {(isOpenComm || (activeChannel && isCommActive)) && (
        <Modal
          isOpen={isOpenComm}
          closeModal={() => setIsOpenComm(false)}
          canMinimize={true}
          minimizedContent={
            <div className="flex items-center gap-3">
              {/* Mic icon */}
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-green-600">
                <FiMic size={16} className="text-white" />
                {currentSpeaker && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </div>

              {/* Text info */}
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {currentSpeaker
                    ? `Speaking: ${currentSpeaker.name}`
                    : "Walkie Talkie"}
                </span>
                <span className="text-xs text-gray-400">
                  {activeChannel?.name || "No channel name"}
                </span>
              </div>
            </div>
          }
          title="Walkie Talkie Communication"
        >
          <CommInterface modal={true} />
        </Modal>
      )}
      <IncomingCallWidget />
    </main>
  );
};

export default DashboardWrapper;
