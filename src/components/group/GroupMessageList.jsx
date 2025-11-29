import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import GroupMessage from "./GroupMessage";
import { ChatContext } from "../../context/ChatContext";
import { COLORS } from "../../utils/chat/messageUtils";
import ChatLoader from "../ChatLoader";

const formatDateLabel = (date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: today.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
  });
};

const groupMessagesByDate = (messages = []) => {
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

const GroupMessageList = ({
  messages = [],
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  messagesContainerRef,
  participants = [],
}) => {
  const { registerMessageRefs } = useContext(ChatContext);
  const groupedMessages = groupMessagesByDate(messages);

  const messageRefs = useRef(new Map());
  useEffect(() => {
    if (typeof registerMessageRefs === "function") {
      registerMessageRefs(messageRefs);
    }
  }, [registerMessageRefs]);

  const messagesById = useMemo(() => {
    const map = new Map();
    (messages || []).forEach((m) => {
      if (m?.id_en) map.set(String(m.id_en), m);
      if (m?.id) map.set(String(m.id), m);
      if (m?.client_id) map.set(String(m.client_id), m);
    });
    return map;
  }, [messages]);

  // Loader sentinel for infinite scroll
  const topLoaderRef = useRef(null);
  // --- Pull-to-refresh (mobile) ---
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

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

  if (!messages?.length) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="italic" style={{ color: COLORS.muted }}>
          Start the conversation!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4 hide-scrollbar relative">
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
          <div className="sticky -top-4 z-10 flex justify-center py-1">
            <span
              className="px-3 py-1 text-xs rounded-full shadow-sm"
              style={{
                color: "#C5D6C3",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {formatDateLabel(new Date(dateKey))}
            </span>
          </div>

          <div className="gap-y-1">
            {dayMessages.map((msg, index) => {
              const sender =
                participants.find(
                  (p) =>
                    p.member_id_encrpt === msg.user_id ||
                    p.member_id === msg.user_id
                ) || {};

              const prevMsg = dayMessages[index - 1];
              const nextMsg = dayMessages[index + 1];

              const showAvatar = !prevMsg || prevMsg.user_id !== msg.user_id;
              const isLastInGroup = !nextMsg || nextMsg.user_id !== msg.user_id;

              return (
                <GroupMessage
                  key={msg.client_id ?? msg.id ?? index}
                  msg={msg}
                  sender={sender}
                  showAvatar={showAvatar}
                  isLastInGroup={isLastInGroup}
                  participants={participants}
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

export default GroupMessageList;
