import React, { useState, useContext, useRef, useEffect } from "react";
// @ts-ignore
import logo from "../../../assets/logo.png";
import { AuthContext } from "../../../context/AuthContext";
import { ChatContext } from "../../../context/ChatContext";
import { MeetingContext } from "../../../context/MeetingContext";
import { useMeeting } from "@videosdk.live/react-sdk";
import { onFailure } from "../../../utils/notifications/OnFailure";
import { onPrompt } from "../../../utils/notifications/onPrompt";
import { onSuccess } from "../../../utils/notifications/OnSuccess";
import audioController from "../../../utils/audioController";
import callerTone from "../../../assets/audio/caller.mp3";
import ParticipantMedia from "./ParticipantMedia";
import CallSetupPanel from "./CallSetupPanel";
import { formatCallDuration } from "../../../utils/formmaters";
import useChat from "../../../hooks/useChat";
import { useQueryClient } from "@tanstack/react-query";

const CallComponentContent = ({ meetingId, setMeetingId }: any) => {
  const { authDetails } = useContext<any>(AuthContext);
  const {
    callMessage,
    setCallMessage,
    callDuration,
    setCallDuration,
    setModalTitle,
  } = useContext(ChatContext);
  const { setProviderMeetingId } = useContext(MeetingContext);
  const { updateCallLog } = useChat();
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [isRinging, setIsRinging] = useState(true);
  const [other, setOther] = useState<any | null>(null);
  const [me, setMe] = useState<any | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const callTimer = useRef<NodeJS.Timeout | null>(null);
  const callStartRef = useRef<number | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callLogUpdatedRef = useRef(false);

  const { join, leave, participants, localMicOn, toggleMic } = useMeeting({
    onMeetingJoined: () => {
      setIsMeetingActive(true);
      onSuccess({ message: "Call Started", success: "Joined successfully." });
      audioController.playRingtone(callerTone);
      if (!localMicOn) toggleMic();
    },
    onMeetingLeft: () => {
      setIsMeetingActive(false);
      if (callTimer.current) clearInterval(callTimer.current);
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      callStartRef.current = null;
      setIsRinging(false);
    },
    onParticipantJoined: () => {
      setIsRinging(false);
      setCallMessage((prev) => ({ ...prev, status: "on" }));
      audioController.stopRingtone();

      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }

      if (!callStartRef.current) {
        callStartRef.current = Date.now();
        callTimer.current = setInterval(() => {
          const now = Date.now();
          const duration = Math.floor((now - callStartRef.current!) / 1000);
          setCallDuration(duration);
          setModalTitle(formatCallDuration(duration));
        }, 1000);
      }
    },
    onParticipantLeft: () => {
      const count = [...participants.values()].length;
      if (count <= 1) {
        handleLeave("others");
      }
    },

    onError: (err) => onFailure({ message: "Call Error", error: err.message }),
  });

  const handleLeave = async (reason: string) => {
    if (callTimer.current) clearInterval(callTimer.current);

    console.log(callMessage, callDuration, callLogUpdatedRef.current);

    const isMissed = !callStartRef.current; // truly missed if never connected

    // 👇 Prevent double logging from both parties (server-side)
    if (reason === "manual" && callMessage?.id) {
      try {
        await updateCallLog.mutateAsync({
          mss_id: callMessage?.id,
          call_duration: callDuration
            ? formatCallDuration(callDuration)
            : "00:00",
          call_state: isMissed ? "miss" : "pick",
        } as any);

        callLogUpdatedRef.current = true; // mark as logged

        if (isMissed) {
          onPrompt({
            title: "Call Missed",
            message: "No response from the other user. You have left the call.",
          });
        } else {
          onSuccess({
            message: "Call Ended",
            success: "You have successfully left the call.",
          });
        }
      } catch (error) {
        console.warn("Call log update failed:", error);
      }
    }

    // Clean up regardless
    try {
      leave();
    } catch (e) {
      console.warn("leave() threw:", e);
    }
    setIsMeetingActive(false);
    setMeetingId(null);
    audioController.stopRingtone();
    setCallMessage(null);
    setProviderMeetingId(null);
    setShowSummary(true);
  };

  useEffect(() => {
    // Auto-leave after 10s if I initiated the call, it's still ringing, and no one has joined yet.
    if (isInitiator && isRinging && !callStartRef.current) {
      ringTimeoutRef.current = setTimeout(() => {
        console.warn("Auto-leaving call due to no response after 10s");
        handleLeave("auto"); // this will mark as missed
      }, 30000); // 30 seconds
    }

    return () => {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
      }
    };
  }, [isInitiator, isRinging, callMessage]);

  // Set `me` and `other` participants
  useEffect(() => {
    if (participants && isMeetingActive) {
      const myParticipant = [...participants.values()].find(
        (p) => p.id === authDetails?.user?.id
      );
      const otherParticipant = [...participants.values()].find(
        (p) => p.id !== authDetails?.user?.id
      );
      setMe(myParticipant);
      setOther(otherParticipant);
    }
  }, [participants, isMeetingActive]);

  return (
    <div className="flex flex-col items-center bg-olive p-5">
      <div className="relative w-full">
        {!isMeetingActive ? (
          <CallSetupPanel
            meetingId={meetingId}
            setMeetingId={setMeetingId}
            setCallDuration={setCallDuration}
            join={join}
            setShowSummary={setShowSummary}
            showSummary={showSummary}
            callDuration={callDuration}
            isInitiator={isInitiator}
            setIsInitiator={setIsInitiator}
          />
        ) : (
          me && (
            <ParticipantMedia
              participantId={me?.id}
              auth={authDetails}
              isRinging={isRinging}
              callDuration={callDuration}
              handleLeave={handleLeave}
              participant={other}
              isInitiator={true}
            />
          )
        )}
      </div>

      <img src={logo} alt="Defcomm Icon" className="w-40 mt-8 filter invert" />
    </div>
  );
};

export default CallComponentContent;
