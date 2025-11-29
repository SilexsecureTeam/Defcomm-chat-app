import { useState, useRef, useEffect, useContext } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { MdSend, MdCancel } from "react-icons/md";
import useComm from "../../hooks/useComm";
import buttonSound from "../../assets/audio/radio-button.mp3";
import { CommContext } from "../../context/CommContext";

const playClickSound = () => {
  const audio = new Audio(buttonSound);
  audio.play().catch((err) => console.error("Failed to play sound:", err));
};

const VoiceRecordButton = ({ channelId }) => {
  const { voiceMode } = useContext(CommContext);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const { broadcastMessage } = useComm();

  useEffect(() => {
    return () => stopMediaTracks();
  }, []);

  const stopMediaTracks = () => {
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      playClickSound();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        stopMediaTracks();
        const blob = new Blob(recordedChunks.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setIsRecording(false);
        clearInterval(timerRef.current);

        if (voiceMode === "hold") {
          handleSend(blob); // Auto-send
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    playClickSound();
    mediaRecorderRef.current?.stop();
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setDuration(0);
  };

  const handleSend = (blobOverride = null) => {
    const blobToSend = blobOverride || audioBlob;
    if (!blobToSend || !channelId) return;

    const formData = new FormData();
    formData.append("channel", channelId);
    formData.append("record", blobToSend, "voice.webm");

    broadcastMessage.mutateAsync(formData, {
      onSuccess: () => {
        setAudioBlob(null);
        setDuration(0);
      },
    });
  };

  const formatDuration = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <div className="min-h-10 flex items-center justify-center">
        {isRecording && (
          <div className="flex h-10 flex-col items-center text-red-400 animate-pulse">
            <p className="text-xs font-semibold">Recording...</p>
            <p className="text-sm">{formatDuration(duration)}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* TAP TO RECORD */}
        {voiceMode === "tap" && !isRecording && !audioBlob && (
          <button
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition"
            onClick={startRecording}
            aria-label="Start Recording"
          >
            <FaMicrophone size={24} />
          </button>
        )}

        {voiceMode === "tap" && isRecording && (
          <button
            className="p-4 rounded-full bg-yellow-500 hover:bg-yellow-600 transition"
            onClick={stopRecording}
            aria-label="Stop Recording"
          >
            <FaStop size={24} />
          </button>
        )}

        {/* HOLD TO TALK */}
        {voiceMode === "hold" && (
          <button
            className={`
      w-16 h-16 flex items-center justify-center rounded-full shadow-xl
      transition-all duration-150 ease-in-out
      ${
        broadcastMessage.isPending
          ? "bg-green-500" // Loader state color
          : isRecording
          ? "bg-[#e7bd17]" // Recording state
          : "bg-red-600" // Idle state
      }
      hover:bg-opacity-90
      active:translate-y-1
    `}
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
            onPointerLeave={stopRecording}
            disabled={broadcastMessage.isPending}
            aria-label="Hold to Record"
          >
            {broadcastMessage.isPending ? (
              // Loader spinner
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              // Mic icon
              <FaMicrophone size={24} className="text-white" />
            )}
          </button>
        )}

        {/* SEND / CANCEL (TAP MODE ONLY) */}
        {audioBlob && voiceMode === "tap" && (
          <>
            <button
              className="p-4 rounded-full bg-green-600 hover:bg-green-700 transition disabled:opacity-50"
              onClick={() => handleSend()}
              disabled={broadcastMessage.isPending}
              aria-label="Send Recording"
            >
              {broadcastMessage.isPending ? (
                <div className="loader border-2 border-white border-t-transparent w-5 h-5 rounded-full animate-spin" />
              ) : (
                <MdSend size={24} />
              )}
            </button>
            <button
              className="p-4 rounded-full bg-gray-500 hover:bg-gray-600 transition"
              onClick={cancelRecording}
              aria-label="Cancel Recording"
            >
              <MdCancel size={24} />
            </button>
          </>
        )}
      </div>

      {/* User Instructions */}
      {/* User Instructions */}
      <p className="text-xs text-gray-300 text-center min-h-[1.25rem]">
        {voiceMode === "hold" && (
          <>
            {broadcastMessage.isPending
              ? "Sending..."
              : isRecording
              ? "Release to send"
              : "Hold mic to record"}
          </>
        )}

        {voiceMode === "tap" && (
          <>
            {!audioBlob &&
              !isRecording &&
              "Tap mic to start, tap again to stop"}
            {isRecording && "Recording... tap to stop"}
            {audioBlob && "Send or cancel"}
          </>
        )}
      </p>
    </div>
  );
};

export default VoiceRecordButton;
