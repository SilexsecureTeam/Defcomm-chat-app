import React, { useContext, useEffect, useMemo } from "react";
import { MdCall, MdCallEnd, MdCallMissed } from "react-icons/md";
import { ChatContext } from "../../context/ChatContext";
import audioController from "../../utils/audioController";
import callerTone from "../../assets/audio/caller.mp3";
import receiverTone from "../../assets/audio/receiver.mp3";

interface ChatCallInviteProps {
  msg: any;
  isMyChat: boolean;
  onAcceptCall: () => void;
  caller?: string;
}

// Helper functions
function parseTimestamp(val: any): number | null {
  if (!val && val !== 0) return null;
  const n = Number(val);
  if (!Number.isNaN(n)) return n < 1e11 ? Math.floor(n * 1000) : Math.floor(n);
  const parsed = Date.parse(String(val));
  return Number.isNaN(parsed) ? null : parsed;
}

function extractMeetingIdFromMessage(message?: string) {
  if (!message || !message.startsWith("CALL_INVITE")) return null;
  const parts = message.split(":");
  return parts[1] ?? null;
}

function formatDurationSeconds(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
  const secs = String(Math.floor(totalSeconds % 60)).padStart(2, "0");
  const mins = String(Math.floor((totalSeconds / 60) % 60)).padStart(2, "0");
  const hrs = Math.floor(totalSeconds / 3600);
  return hrs > 0 ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
}

function ChatCallInvite({
  msg,
  isMyChat,
  onAcceptCall,
  caller,
}: ChatCallInviteProps) {
  const { callMessage, finalCallData } = useContext(ChatContext);

  const msgIdEn = msg?.id ?? null;
  const msgMeetingId = useMemo(
    () => extractMeetingIdFromMessage(msg?.message),
    [msg]
  );

  // Check if this message is the current active call
  const callMsgMatches = useMemo(() => {
    if (!callMessage) return false;
    try {
      const cm: any = callMessage;
      return (
        (cm.id && msgIdEn && String(cm.id) === String(msgIdEn)) ||
        (cm.meetingId &&
          msgMeetingId &&
          String(cm.meetingId) === String(msgMeetingId))
      );
    } catch {
      return false;
    }
  }, [callMessage, msgIdEn, msgMeetingId]);

  // Determine state for this message
  const inferredState = useMemo(() => {
    if (!callMessage) {
      if (msg?.call_state === "pick" || msg?.call_state === "miss")
        return msg.call_state;
      return "miss";
    }

    if (callMsgMatches) {
      // If the call was picked on another device
      if (
        finalCallData?.id === callMessage?.id &&
        finalCallData?.state === "pick"
      ) {
        return "picked_elsewhere";
      }
      return callMessage.status || "ringing";
    }

    return msg?.call_state || "miss";
  }, [callMessage, callMsgMatches, msg, finalCallData]);

  // Duration display
  const callDuration = useMemo(() => {
    if (msg?.call_duration) return msg.call_duration;
    const startTs = parseTimestamp(msg?.call_started_at ?? msg?.call_start);
    const endTs = parseTimestamp(msg?.call_ended_at ?? msg?.call_end);
    if (startTs && endTs && endTs > startTs)
      return formatDurationSeconds(Math.floor((endTs - startTs) / 1000));
    return null;
  }, [msg]);

  // Play ringtone only for ringing calls
  useEffect(() => {
    const isRinging =
      inferredState === "ringing" &&
      !(callMsgMatches && callMessage?.status === "on");
    if (isRinging) {
      const ringtone = isMyChat ? callerTone : receiverTone;
      audioController.playRingtone(ringtone, true);
    } else {
      audioController.stopRingtone();
    }
    return () => audioController.stopRingtone();
  }, [inferredState, callMessage, callMsgMatches, isMyChat]);

  const getMessageText = () => {
    if (inferredState === "picked_elsewhere")
      return isMyChat
        ? `${caller || "They"} picked the call on another device`
        : "Call picked on another device";
    if (
      callMsgMatches &&
      (callMessage?.status === "on" || inferredState === "on")
    ) {
      return isMyChat
        ? "You are in the call"
        : `${caller || "They"} is in the call`;
    }
    if (inferredState === "miss")
      return isMyChat ? "They missed your call" : "You missed the call";
    if (inferredState === "pick")
      return isMyChat
        ? "You picked the call"
        : `${caller || "They"} picked the call`;
    if (inferredState === "ringing")
      return isMyChat
        ? "You are calling..."
        : `${caller || "They"} is calling...`;
    return isMyChat ? "You called" : `${caller || "They"} called`;
  };

  const getStatusText = () => {
    if (inferredState === "picked_elsewhere") return "Picked on another device";
    if (
      callMsgMatches &&
      (callMessage?.status === "on" || inferredState === "on")
    )
      return "Call Ongoing";
    if (inferredState === "pick") return "Call Ended";
    if (inferredState === "miss") return "Missed Call";
    return inferredState === "ringing" ? "Ringing..." : "Call Ended";
  };

  const getIcon = () => {
    if (
      callMsgMatches &&
      (callMessage?.status === "on" || inferredState === "on")
    )
      return <MdCall size={24} className="text-green-500 animate-pulse" />;
    if (inferredState === "miss")
      return <MdCallMissed size={24} className="text-red-500" />;
    if (inferredState === "pick")
      return <MdCallEnd size={24} className="text-green-500" />;
    return (
      <MdCall
        size={24}
        className={
          inferredState === "ringing" ? "text-green-500" : "text-gray-400"
        }
      />
    );
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-3 p-3 rounded-lg w-full shadow-md font-medium text-sm ${
        isMyChat
          ? "bg-oliveLight text-white self-end"
          : "bg-gray-100 text-black self-start"
      }`}
    >
      {getIcon()}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="truncate">{getMessageText()}</span>
        <span
          className={`text-xs ${
            inferredState === "pick"
              ? "text-green-600"
              : inferredState === "miss"
              ? "text-red-500"
              : "text-gray-500"
          }`}
        >
          {getStatusText()}
        </span>
        {inferredState === "pick" && callDuration && (
          <span
            className={`text-xs ${
              isMyChat ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Duration: {callDuration}
          </span>
        )}
      </div>

      {inferredState === "ringing" &&
        !(callMsgMatches && callMessage?.status === "on") && (
          <button
            onClick={onAcceptCall}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={inferredState === "picked_elsewhere"} // disable button
          >
            {isMyChat ? "Join" : "Accept"}
          </button>
        )}

      {callMsgMatches &&
        (callMessage?.status === "on" || inferredState === "on") && (
          <button className="bg-olive/80 hover:bg-olive text-white px-3 py-1 rounded text-sm">
            Return
          </button>
        )}
    </div>
  );
}

export default ChatCallInvite;
