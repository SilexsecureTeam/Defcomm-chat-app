import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { MdMic } from "react-icons/md";
import { FaPlay, FaPause, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { BiTransferAlt } from "react-icons/bi";
import { formatLocalTime } from "../../utils/formmaters";
import useTrans from "../../hooks/useTrans";
import useDeviceSettings from "../../hooks/useDeviceSettings";

const CommLogList = ({
  walkieMessages,
  isPlayingId,
  handlePlayPause,
  logEndRef,
}) => {
  const { getLanguagesQuery } = useDeviceSettings();
  const { data: LANGUAGES } = getLanguagesQuery;
  const { speechToSpeech } = useTrans();

  const localAudioRef = useRef(null);
  const [translations, setTranslations] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [s2sLang, setS2sLang] = useState("fr");
  // Add extra state for tracking playing translation
  const [playingTranslationId, setPlayingTranslationId] = useState(null);

  const playTranslationUrl = (url, i) => {
    // if same translation is already playing → pause it
    if (playingTranslationId === i && localAudioRef.current) {
      localAudioRef.current.pause();
      setPlayingTranslationId(null);
      return;
    }

    // stop any previous audio
    if (localAudioRef.current) {
      localAudioRef.current.pause();
    }

    const audio = new Audio(url);
    localAudioRef.current = audio;

    audio.play();
    setPlayingTranslationId(i);

    // reset when playback ends
    audio.onended = () => setPlayingTranslationId(null);
  };

  const handleS2S = async (msg, i) => {
    try {
      setLoadingId(i);
      const res = await speechToSpeech({
        audio: `${import.meta.env.VITE_BASE_URL}${msg.record}`,
        target_lang: s2sLang,
      });

      setTranslations((prev) => ({
        ...prev,
        [i]: {
          translated: res.translated_text,
          audioUrl: res.audio_file_url
            ? `${import.meta.env.VITE_BASE_URL}${res.audio_file_url}`
            : null,
        },
      }));

      setExpanded((prev) => ({ ...prev, [i]: true }));

      if (res.audio_file_url) {
        playTranslationUrl(
          `${import.meta.env.VITE_BASE_URL}${res.audio_file_url}`
        );
      }
    } catch (err) {
      console.error("S2S error:", err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 🌍 Global target language */}
      <div className="flex gap-3 items-center px-3 py-2 border-b border-lime-400/30 text-xs">
        <span className="text-gray-300">Translate to:</span>
        <select
          value={s2sLang}
          onChange={(e) => setS2sLang(e.target.value)}
          className="bg-transparent border border-lime-400 rounded px-1 py-0.5 text-white text-xs max-w-28"
        >
          {LANGUAGES?.map(({ id, code, language }) => (
            <option key={id} value={code} className="bg-black">
              {language}
            </option>
          ))}
        </select>
      </div>

      {/* 📨 Message log */}
      <div className="overflow-y-auto px-3 py-2 text-xs space-y-3 flex-1">
        {walkieMessages.length === 0 ? (
          <p className="text-gray-400 italic">Awaiting transmission...</p>
        ) : (
          walkieMessages
            ?.filter((msg) => msg.type === "voice")
            ?.map((msg, i) => {
              const isMine = msg.display_name === "You";
              const isLoading = loadingId === i;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isMine ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col gap-2 p-3 rounded-md max-w-96
                  ${isMine ? "ml-auto text-right" : ""}
                  ${
                    isMine
                      ? "bg-gradient-to-br from-lime-500/30 to-green-400/10 border border-lime-400/50"
                      : "bg-gradient-to-r from-gray-800/30 to-gray-900/20 border border-lime-400/20"
                  }`}
                >
                  {/* 🏷 Header */}
                  <div
                    className={`flex justify-between items-center ${
                      isMine ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 ${
                        isMine ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-[0.7rem] font-bold shadow
                        ${
                          isMine
                            ? "bg-lime-400 text-black"
                            : "bg-gradient-to-br from-lime-400 to-green-700 text-black"
                        }`}
                      >
                        {(msg.user_name || "?").charAt(0)}
                      </div>
                      <span className="text-lime-300 font-semibold">
                        {isMine ? "You" : msg?.display_name || "Anonymous"}
                      </span>
                    </div>
                    <span className="text-gray-400 text-[0.65rem]">
                      {msg.time || formatLocalTime()}
                    </span>
                  </div>

                  {/* 🎤 Original voice */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlayPause(msg, i)}
                      className="p-1 rounded-full border border-lime-400 hover:bg-lime-500 hover:text-black transition"
                    >
                      {isPlayingId === i ? (
                        <FaPause size={12} />
                      ) : (
                        <FaPlay size={12} />
                      )}
                    </button>
                    <MdMic size={12} />
                    <span>Original voice</span>
                  </div>

                  {/* 🔘 Actions */}
                  <div className="flex items-center gap-3 text-xs text-lime-300">
                    <button
                      onClick={() => handleS2S(msg, i)}
                      disabled={isLoading}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <BiTransferAlt />
                      {isLoading ? "Translating..." : "Translate"}
                    </button>
                    <button
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))
                      }
                      className="ml-auto text-gray-400 hover:text-white flex items-center"
                    >
                      {expanded[i] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>

                  {/* 🌐 Collapsible result */}
                  {expanded[i] && translations[i] && (
                    <div className="mt-2 p-2 bg-black/30 rounded text-gray-200 text-xs space-y-2 text-start">
                      <p className="italic text-gray-300">
                        🌐 {translations[i].translated}
                      </p>
                      {translations[i].audioUrl && (
                        <button
                          onClick={() =>
                            playTranslationUrl(translations[i].audioUrl, i)
                          }
                          className="flex items-center gap-1 p-1 rounded border border-lime-400 hover:bg-lime-500 hover:text-black"
                        >
                          {playingTranslationId === i ? (
                            <>
                              <FaPause size={10} /> Pause translated audio
                            </>
                          ) : (
                            <>
                              <FaPlay size={10} /> Play translated audio
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default CommLogList;
