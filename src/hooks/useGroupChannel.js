import { useContext, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext";
import { GroupContext } from "../context/GroupContext";
import { onNewNotificationToast } from "../utils/notifications/onNewMessageToast";
import { NotificationContext } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { ChatContext } from "../context/ChatContext";

const useGroupChannels = ({ groups, token }) => {
  const pusherRef = useRef(null);
  const navigate = useNavigate();
  const { authDetails } = useContext(AuthContext);
  const { chatVisibility } = useContext(ChatContext);
  const { setGroupUserTyping, setGroupConnections } = useContext(GroupContext);
  const { addNotification, markAsSeen } = useContext(NotificationContext);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !groups?.length) return;

    if (pusherRef.current) {
      pusherRef.current.disconnect();
    }

    const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
      cluster: "mt1",
      wsHost: import.meta.env.VITE_PUSHER_HOST,
      forceTLS: true,
      disableStats: true,
      enabledTransports: ["ws", "wss"],
      authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT,
      auth: { headers: { Authorization: `Bearer ${token}` } },
    });

    groups.forEach((group) => {
      const channelName = `private-group.${group.group_id}`;
      const channel = pusher.subscribe(channelName);

      const handleSubSuccess = () =>
        setGroupConnections((prev) => ({
          ...prev,
          [group.group_id]: "connected",
        }));

      const handleSubError = () =>
        setGroupConnections((prev) => ({
          ...prev,
          [group.group_id]: "error",
        }));

      const handleMessage = ({ data }) => {
        const incomingMsg = data.data;
        const senderId = incomingMsg.user_id;

        console.log("Group message received:", data);

        if (data?.state === "is_typing") {
          setGroupUserTyping?.((prev) => ({
            ...prev,
            [data?.sender_id]: true,
          }));
          return;
        } else if (data?.state === "not_typing") {
          setGroupUserTyping?.((prev) => ({
            ...prev,
            [data?.sender_id]: false,
          }));
          return;
        }

        if (!senderId) return;

        const isMyChat = senderId === authDetails?.user?.id;

        if (!isMyChat) {
          addNotification(data);
          onNewNotificationToast({
            senderName: data?.sender?.name,
            message: data?.message,
            type: "group",
            groupName: group.group_name,
            onClick: () => {
              markAsSeen(incomingMsg.id);
              navigate(`/dashboard/group/${incomingMsg.user_to}/chat`);
            },
            isChatVisible: chatVisibility,
            tagMess: incomingMsg.tag_mess,
            tagUser: incomingMsg.tag_user,
            myId: authDetails?.user_enid,
          });
        }

        queryClient.setQueryData(["groupMessages", group.group_id], (old) => {
          if (!old || !Array.isArray(old.pages)) return old;

          const lastPage = old.pages[old.pages.length - 1];

          // Avoid duplicates
          const exists = lastPage.data.some((msg) => msg.id === incomingMsg.id);
          if (exists) return old;

          const newPage = {
            ...lastPage,
            data: [
              ...lastPage.data,
              {
                ...incomingMsg,
                message: data.message, // ensure latest message is set
                is_my_chat: isMyChat ? "yes" : "no",
              },
            ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
          };

          return {
            ...old,
            pages: [...old.pages.slice(0, -1), newPage],
          };
        });
      };

      // ✅ Bind with named handlers
      channel.bind("pusher:subscription_succeeded", handleSubSuccess);
      channel.bind("pusher:subscription_error", handleSubError);
      channel.bind("group.message.sent", handleMessage);

      // ✅ Cleanup for this group
      return () => {
        channel.unbind("pusher:subscription_succeeded", handleSubSuccess);
        channel.unbind("pusher:subscription_error", handleSubError);
        channel.unbind("group.message.sent", handleMessage);
        pusher.unsubscribe(channelName);
      };
    });

    pusherRef.current = pusher;

    return () => {
      groups.forEach((group) => {
        const channelName = `private-group.${group.group_id}`;
        const channel = pusher.channel(channelName);
        if (channel) {
          channel.unbind_all();
          pusher.unsubscribe(channelName);
        }
      });
      pusher.disconnect();
    };
  }, [token, groups]);

  return () => {
    try {
      pusherRef.current?.disconnect();
    } catch (e) {
      console.warn("Cleanup error:", e);
    }
  };
};

export default useGroupChannels;
