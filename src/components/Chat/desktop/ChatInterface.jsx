import React, { useRef, useContext } from "react";
import { FaSpinner } from "react-icons/fa6";
import { ChatContext } from "../../../context/ChatContext";
import useChat from "../../../hooks/useChat";
import { motion } from "framer-motion";
import SendMessage from "../SendMessage";
import ChatMessageList from "../ChatMessageList";
import { useAutoScroll } from "../../../utils/chat/useAutoScroll";

const ChatInterface = () => {
  const { typingUsers, selectedChatUser } = useContext(ChatContext);
  const { getChatMessages } = useChat();
  const messageRef = useRef(null);
  const messagesEndRef = useRef(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    isLoading,
  } = getChatMessages(selectedChatUser?.contact_id_encrypt);

  const messages = data?.pages.flatMap((page) => page.data) ?? [];
  const chatMeta = data?.pages?.[0]?.chat_meta;

  useAutoScroll({
    messages,
    containerRef: messageRef,
    endRef: messagesEndRef,
    typing: Boolean(typingUsers[selectedChatUser?.contact_id]),
    pauseAutoScroll: isFetchingNextPage,
  });

  return (
    <div className="relative h-full flex flex-col">
      <div
        ref={messageRef}
        className="flex-1 w-full overflow-y-auto flex flex-col p-4"
      >
        {selectedChatUser ? (
          isLoading ? (
            <div className="h-20 flex justify-center items-center text-oliveGreen gap-2">
              <FaSpinner className="animate-spin text-2xl" /> Loading Messages
            </div>
          ) : (
            <>
              <ChatMessageList
                desktop={true}
                messages={messages}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                messagesContainerRef={messageRef}
              />

              {/* 🔹 Typing indicator as a new bubble */}
              {typingUsers[selectedChatUser?.contact_id] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start space-x-1 ml-5 mt-3"
                >
                  <div className="p-2 rounded-lg bg-white text-black shadow-md flex items-center space-x-1 max-w-40">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )
        ) : (
          <p className="text-center text-lg font-bold mt-10">
            Select a chat to start messaging.
          </p>
        )}
      </div>
      {selectedChatUser && (
        <SendMessage
          messageData={chatMeta}
          scrollRef={messageRef}
          messagesEndRef={messagesEndRef}
        />
      )}
    </div>
  );
};

export default ChatInterface;
