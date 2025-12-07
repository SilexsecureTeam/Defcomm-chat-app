import { useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Pusher from "pusher-js";
import { onNewNotificationToast } from "../utils/notifications/onNewMessageToast";
import receiverTone from "../assets/audio/receiver.mp3";
import audioController from "../utils/audioController";
import { queryClient } from "../services/query-client";
import { ChatContext } from "../context/ChatContext";
import { NotificationContext } from "../context/NotificationContext";
import { AuthContext } from "../context/AuthContext";
import useAuth from "./useAuth";
import { onLogoutToast } from "../utils/notifications/onLogoutToast";
import { normalizeId } from "../utils/formmaters";

const usePusherChannel = ({ userId, token }) => {
  const pusherRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { authDetails, setLogoutSignal, updateAuth } = useContext(AuthContext);
  const {
    setTypingUsers,
    setCallMessage,
    chatVisibility,
    setFinalCallData,
    selectedChatUser,
  } = useContext(ChatContext);
  const { addNotification, markAsSeen } = useContext(NotificationContext);

  useEffect(() => {
    if (!userId || !token) return;

    // Clean previous connection
    if (pusherRef.current) {
      try {
        pusherRef.current.disconnect();
      } catch (e) {
        console.warn("Pusher disconnect error:", e);
      }
      pusherRef.current = null;
    }

    const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
      cluster: "mt1",
      wsHost: import.meta.env.VITE_PUSHER_HOST,
      forceTLS: true,
      disableStats: true,
      enabledTransports: ["ws", "wss"],
      authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    pusherRef.current = pusher;
    const channel = pusher.subscribe(`private-chat.${userId}`);

    channel.bind("private.message.sent", ({ data }) => {
      const newMessage = data;
      const isCall = data?.state === "call";
      const senderUserId = normalizeId(newMessage?.sender);
      const receiverUserId = normalizeId(newMessage.receiver);

      const isMyChat = senderUserId === authDetails?.user?.id;
      const cacheKeyUserId = isMyChat
        ? receiverUserId // I sent it → save under receiver
        : senderUserId; // They sent it → save under sender

      // Show toast only if not my message
      const shouldToast =
        (data?.state === "text" || data?.state === "call") && !isMyChat;
      if (data?.state === "logout" && data?.device === "all") {
        if (authDetails?.device_id !== data?.sender_iden) {
          setLogoutSignal(true);
          // Clear auth state
          updateAuth(null);
          // Selectively clear cache (safer than full clear)
          queryClient.removeQueries();
          setTimeout(() => {
            // Redirect
            navigate("/login", {
              state: { from: null, fromLogout: true },
              replace: true,
            });

            onLogoutToast();
          }, 3000); // give user 3s to read the message
        } else {
          // Clear auth state
          updateAuth(null);
          navigate("/login", {
            state: { from: null, fromLogout: true },
            replace: true,
          });
        }
      }

      // Handle call messages
      if (isCall) {
        const meetingId = newMessage?.message?.split("CALL_INVITE:")[1];
        setCallMessage({
          ...data?.mss_chat,
          meetingId,
          name: newMessage?.sender?.name || `User ${newMessage?.data?.user_id}`,
          phone: newMessage?.sender?.phone,
          user_id: newMessage?.data?.user_id,
          status: "ringing",
        });
        audioController.playRingtone(receiverTone, true);
      }
      const isChatOpen =
        selectedChatUser?.contact_id_encrypt === cacheKeyUserId;

      if (shouldToast) {
        console.log(newMessage, isMyChat, cacheKeyUserId);
        addNotification(newMessage);
        onNewNotificationToast({
          message: newMessage?.message,
          senderName:
            newMessage?.sender?.name?.split(" ")[0] ||
            `User ${newMessage?.data?.user_id}`,
          onClick: () => {
            markAsSeen(newMessage?.data?.id);
            navigate(`/dashboard/user/${newMessage?.data?.user_id}/chat`, {
              state: newMessage?.sender,
              isChatVisible: chatVisibility,
            });
          },
          type: isCall ? "call" : "message",
          tagMess: newMessage?.data?.tag_mess,
          tagUser: newMessage?.data?.tag_user,
        });
      } else if (isChatOpen) {
        console.log("Message to mark", newMessage?.data?.id);

        if (newMessage?.data?.id) markAsSeen(newMessage?.data?.id); // Auto mark as seen immediately
      }

      // Cache update always (multi-device sync)
      if (
        newMessage.state === "call" ||
        newMessage.state === "text" ||
        newMessage.state === "callUpdate"
      ) {
        const base =
          newMessage.state === "callUpdate" ? newMessage.mss : newMessage.data;

        const messageToStore = {
          ...base,
          id: normalizeId(base),
          is_my_chat: isMyChat ? "yes" : "no",
        };

        queryClient.setQueryData(["chatMessages", cacheKeyUserId], (old) => {
          if (!old || !old.pages || old.pages.length === 0) {
            return {
              pages: [
                {
                  data: [messageToStore],
                  chat_meta: {
                    chat_user_id: newMessage.user_to || newMessage.user_id,
                    chat_user_id_en: cacheKeyUserId,
                    current_page: 1,
                    last_page: 1,
                    per_page: 10,
                    total: 1,
                    urlparams: "?page=",
                  },
                },
              ],
              pageParams: [],
            };
          }

          const lastPage = old.pages[old.pages.length - 1];

          const existsIndex = lastPage.data.findIndex(
            (msg) => msg.id === messageToStore.id
          );

          if (existsIndex !== -1) {
            // UPDATE EXISTING MESSAGE (important for callUpdate)
            const updatedMsg = {
              ...lastPage.data[existsIndex],
              ...messageToStore,
            };

            const updatedData = [...lastPage.data];
            updatedData[existsIndex] = updatedMsg;

            const newLastPage = {
              ...lastPage,
              data: updatedData,
            };

            return {
              ...old,
              pages: [...old.pages.slice(0, -1), newLastPage],
            };
          }
          const newLastPage = {
            ...lastPage,
            data: [
              ...lastPage.data,
              {
                ...messageToStore,
                is_my_chat: isMyChat ? "yes" : "no",
              },
            ].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            ),
          };

          return {
            ...old,
            pages: [...old.pages.slice(0, -1), newLastPage],
          };
        });
      }

      if (newMessage?.state === "last_message") {
        console.log(newMessage, isMyChat, cacheKeyUserId);
        queryClient.setQueryData(["last-chats"], (prevChats) => {
          return newMessage?.data;
        });
      }
      // Typing indicators
      if (newMessage?.state === "is_typing") {
        setTypingUsers((prev) => {
          if (prev[newMessage?.sender_id]) return prev;
          return { ...prev, [newMessage?.sender_id]: true };
        });
        return;
      } else if (newMessage?.state === "not_typing") {
        setTypingUsers((prev) => {
          if (!prev[newMessage?.sender_id]) return prev;
          return { ...prev, [newMessage?.sender_id]: false };
        });
        return;
      }

      // Handle call updates
      if (newMessage?.state === "callUpdate") {
        setFinalCallData({
          id: normalizeId(newMessage),
          duration: newMessage?.call?.call_duration,
          state: newMessage?.call?.call_state,
        });
      }

      // 🔇 If another device picked the call, stop ringtone + clear callMessage
      if (newMessage?.call?.call_state === "pick") {
        audioController.stopRingtone();
        setCallMessage((prev) => {
          if (prev?.user_id === cacheKeyUserId) {
            return { ...prev, status: "picked" };
          }
          return prev;
        });
      }
    });

    channel.bind("pusher:subscription_error", (status) => {
      console.error("Pusher subscription error:", status);
    });

    return () => {
      try {
        pusher.disconnect();
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
    };
  }, [userId, token]);
};

export default usePusherChannel;
