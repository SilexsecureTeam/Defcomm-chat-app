import React, { useEffect, useMemo, useRef, useContext, useState } from "react";
import { useLocation } from "react-router-dom";
import { getFormattedDate } from "../../utils/formmaters";
import ChatMessage from "./ChatMessage";
import { ChatContext } from "../../context/ChatContext";
import { COLORS } from "../../utils/chat/messageUtils";
import ChatLoader from "../ChatLoader";

const ChatMessageList = ({
  desktop = false,
  messages = [],
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  messagesContainerRef,
}) => {
  const location = useLocation();
  const chatUserData = location?.state;
  const { registerMessageRefs } = useContext(ChatContext);

  const messageRefs = useRef(new Map());
  const topLoaderRef = useRef(null);

  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  // Group messages by date (sorted ASC)
  const groupMessagesByDate = (messages) => {
    if (!messages) return {};
    const sorted = [...messages].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    return sorted.reduce((acc, msg) => {
      const dateKey = new Date(msg.created_at).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(msg);
      return acc;
    }, {});
  };

  // Lookup map for reply/tag resolution
  const messagesById = useMemo(() => {
    const map = new Map();
    (messages || [])?.forEach((m) => {
      if (m?.id) map.set(String(m.id), m);
    });
    return map;
  }, [messages]);

  useEffect(() => {
    if (typeof registerMessageRefs === "function") {
      registerMessageRefs(messageRefs);
    }
  }, [registerMessageRefs]);

  const groupedMessages = groupMessagesByDate(messages);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || pulling) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          const container = messagesContainerRef.current;
          if (!container) return;

          const prevHeight = container.scrollHeight;

          fetchNextPage().then(() => {
            requestAnimationFrame(() => {
              const newHeight = container.scrollHeight;
              const scrollDiff = newHeight - prevHeight;
              container.scrollTop = container.scrollTop + scrollDiff;
            });
          });
        }
      },
      { root: messagesContainerRef.current, threshold: 0.1 }
    );

    if (topLoaderRef.current) {
      observer.observe(topLoaderRef.current);
    }

    return () => {
      if (topLoaderRef.current) observer.unobserve(topLoaderRef.current);
    };
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    messagesContainerRef,
    pulling,
  ]);

  // Pull-to-refresh style for mobile
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (container.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        setPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!pulling) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        setPullDistance(Math.min(delta, 100)); // limit to 100px
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 60 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
      setPullDistance(0);
      setPulling(false);
    };

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pulling, pullDistance, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (!messages?.length)
    return (
      <div className="flex justify-center items-center h-full">
        <p className="italic" style={{ color: COLORS.muted }}>
          Start the conversation!
        </p>
      </div>
    );

  return (
    <div className="flex-1 px-4 relative">
      {/* Pull to refresh loader (mobile only) */}
      <div
        className="flex justify-center items-center absolute top-0 left-0 right-0 z-[60]"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pulling ? "none" : "transform 0.3s ease",
        }}
      >
        {pulling && !isFetchingNextPage && pullDistance > 20 && (
          <span className="text-xs text-gray-600 bg-white/80 px-3 py-1 rounded-full shadow">
            {pullDistance > 60 ? "Release to load more" : "Pull to load"}
          </span>
        )}
      </div>

      {/* Infinite scroll loader (inline like WhatsApp) */}
      <div ref={topLoaderRef} className="flex justify-center py-3">
        {isFetchingNextPage && <ChatLoader />}
      </div>
      {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
        <div key={dateKey} className="relative">
          {/* Sticky date header */}
          <div
            className={`sticky z-50 ${
              desktop ? "top-0" : "-top-4"
            } flex justify-center py-1 w-max pointer-events-none mx-auto`}
          >
            <span
              className={`px-3 py-1 text-xs rounded-full shadow-sm border ${
                desktop
                  ? "text-gray-500 border-gray-800"
                  : "text-gray-700 border-gray-300"
              }`}
            >
              {getFormattedDate(dayMessages[0].updated_at)}
            </span>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {dayMessages.map((msg, index) => {
              const nextMsg = dayMessages[index + 1];
              const isLastMessageFromUser =
                msg.is_my_chat !== "yes" &&
                (!nextMsg || nextMsg.is_my_chat === "yes");

              return (
                <ChatMessage
                  key={`${msg.id}-${msg.created_at}`}
                  msg={msg}
                  selectedChatUser={chatUserData}
                  isLastMessageFromUser={isLastMessageFromUser}
                  messagesById={messagesById}
                  messageRefs={messageRefs}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessageList;
