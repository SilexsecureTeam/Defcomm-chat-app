import React, { useContext, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { ChatContext } from "../../../context/ChatContext";
import { AuthContext } from "../../../context/AuthContext";
import { MeetingContext } from "../../../context/MeetingContext";
import { sendMessageUtil } from "../../../utils/chat/sendMessageUtil";
import { createMeeting } from "../Api";
import { onFailure } from "../../../utils/notifications/OnFailure";
import { useSendMessageMutation } from "../../../hooks/useSendMessageMutation";
import CallSummary from "../../Chat/CallSummary";
import { axiosClient } from "../../../services/axios-client";
import useChat from "../../../hooks/useChat";
import audioController from "../../../utils/audioController";
import {
  extractErrorMessage,
  formatCallDuration,
} from "../../../utils/formmaters";
import { useLocation } from "react-router-dom";

const CallSetupPanel = ({
  meetingId,
  setMeetingId,
  setCallDuration,
  callDuration,
  join,
  showSummary = false,
  setShowSummary = () => {},
  isInitiator,
  setIsInitiator,
  isTokenLoading,
}: any) => {
  const { callMessage, setModalTitle, finalCallData, setFinalCallData } =
    useContext(ChatContext);
  const { updateCallLog } = useChat();
  const { authDetails } = useContext<any>(AuthContext);
  const { setProviderMeetingId, setIsCall } = useContext(MeetingContext);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const chatUserData = location?.state;

  const messageData = chatUserData?.chat_meta;
  const client = axiosClient(authDetails?.access_token);
  const sendMessageMutation = useSendMessageMutation(client);

  const handleCreateMeeting = async () => {
    setIsCreatingMeeting(true);
    try {
      const newMeetingId = await createMeeting();
      if (newMeetingId) {
        setIsInitiator(true);
        setProviderMeetingId(newMeetingId);
        setIsCall(true);
        setMeetingId(newMeetingId);
        setShowSummary(false);
        setFinalCallData(null);
        setCallDuration(0);
        setModalTitle("Call Setup");
      }
    } catch (error) {
      onFailure({
        message: "Meeting Creation Failed",
        error: extractErrorMessage(error),
      });
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  // Start Call (for initiator)
  const handleStartCall = async () => {
    if (!meetingId) {
      onFailure({
        message: "Meeting ID Error",
        error: "Meeting ID is missing.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const messageSent = await sendMessageUtil({
        message: `CALL_INVITE:${meetingId}`,
        file: null,
        chat_user_type: "user",
        chat_user_id: chatUserData?.contact_id_encrypt,
        chat_id: null,
        mss_type: "call",
        sendMessageMutation,
        tag_mess: null,
        tag_users: null,
      });

      if (!messageSent) {
        return; // Don't proceed if sending failed
      }
      setModalTitle("Call in Progress");
      await join(); // Proceed only if message was actually sent
    } catch (error: any) {
      onFailure({
        message: "Meeting Join Failed",
        error:
          extractErrorMessage(error) ||
          "Something went wrong while joining the meeting.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Join Meeting (for invited participant)
  const handleJoinMeeting = async () => {
    if (!meetingId) {
      onFailure({
        message: "Meeting ID Error",
        error: "Meeting ID is missing.",
      });
      return;
    }
    setIsLoading(true);
    try {
      await updateCallLog.mutateAsync(
        {
          mss_id: callMessage?.id,
          duration: formatCallDuration(callDuration),
          call_state: "pick",
        } as any,
        {
          onSuccess: () => {
            join();
            audioController.stopRingtone();
          },
        }
      );
    } catch (error) {
      onFailure({
        message: "Call Log Update Failed",
        error: extractErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-10 w-72 md:w-96 rounded-lg flex flex-col items-center">
      {showSummary && (
        <CallSummary
          callSummary={{
            duration:
              finalCallData?.duration || formatCallDuration(callDuration),
            caller: isInitiator ? "You" : chatUserData?.contact_name,
            receiver: !isInitiator ? "You" : chatUserData?.contact_name,
          }}
        />
      )}
      {!meetingId || showSummary ? (
        <button
          onClick={handleCreateMeeting}
          disabled={isCreatingMeeting || isTokenLoading}
          className="bg-oliveLight hover:bg-oliveDark text-white p-2 rounded-full mt-4 min-w-40 font-bold flex items-center justify-center gap-2"
        >
          Initiate Call{" "}
          {(isCreatingMeeting || isTokenLoading) && (
            <FaSpinner className="animate-spin" />
          )}
        </button>
      ) : isInitiator ? (
        <button
          disabled={isLoading || isTokenLoading}
          onClick={handleStartCall}
          className="bg-green-600 text-white p-2 rounded-full mt-4 min-w-40 font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
        >
          Start Call{" "}
          {(isLoading || isTokenLoading) && (
            <FaSpinner className="animate-spin" />
          )}
        </button>
      ) : (
        <button
          onClick={handleJoinMeeting}
          className="bg-green-600 text-white p-2 rounded-full mt-4 min-w-40 font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
        >
          Join Call {isLoading && <FaSpinner className="animate-spin" />}
        </button>
      )}
    </div>
  );
};

export default CallSetupPanel;
