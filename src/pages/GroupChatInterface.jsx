import { useState, useEffect, useRef, useContext, useMemo } from "react";
import { Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import GroupChatDetails from "../components/dashboard/GroupChatDetails";
import useGroups from "../hooks/useGroup";
import useChat from "../hooks/useChat";
import SendMessage from "../components/Chat/SendMessage";
import { GroupContext } from "../context/GroupContext";
import GroupMessageList from "../components/group/GroupMessageList";
import { FaCog } from "react-icons/fa";
import { ChatContext } from "../context/ChatContext";
import { IoArrowBack } from "react-icons/io5";
import { useAutoScroll } from "../utils/chat/useAutoScroll";

const GroupChatInterface = () => {
  const { groupId } = useParams();
  const { authDetails } = useContext(AuthContext);
  const { setActiveGroup, groupConnections } = useContext(GroupContext);
  const { setShowSettings, setMembers } = useContext(ChatContext);
  const navigate = useNavigate();

  const connectionStatus = groupConnections?.[groupId];

  const { useFetchGroupInfo } = useGroups();
  const { getGroupChatMessages } = useChat();

  const { data: groupInfo, isLoading } = useFetchGroupInfo(groupId);
  const mergedGroupInfo = useMemo(() => {
    if (!groupInfo) return null;
    const members = groupInfo?.data || [];
    const alreadyMember = members.some(
      (m) => m.contact_id === authDetails?.user?.id // adapt key if different
    );

    if (alreadyMember) return groupInfo;

    return {
      ...groupInfo,
      data: [
        ...members,
        {
          member_id: authDetails?.user?.id,
          member_id_encrpt: authDetails?.user_enid,
          member_name: authDetails?.user?.name,
          member_email: authDetails?.user?.email,
          // you can add avatar or other props here if needed
          isSelf: true,
        },
      ],
    };
  }, [groupInfo, authDetails]);

  useEffect(() => {
    setActiveGroup(mergedGroupInfo);
  }, [mergedGroupInfo]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    isLoading: isMessagesLoading,
  } = getGroupChatMessages(mergedGroupInfo?.group_meta?.id ?? null);

  const messages = data?.pages.flatMap((page) => page.data) ?? [];
  const chatMeta = data?.pages?.[0]?.chat_meta;

  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const messageRef = useRef(null);
  useEffect(() => {
    setMembers(mergedGroupInfo?.data);
  }, [messages]);

  useAutoScroll({
    messages,
    containerRef: messageRef,
    endRef: messagesEndRef,
    typing: false,
    pauseAutoScroll: isFetchingNextPage, // pause when fetching older pages
  });

  const COLORS = {
    header: "#1C1C1C",
    avatar: "#B49E69",
    messagesBg: "#212121",
    scrollbarThumb: "#4A5568",
    scrollbarTrack: "#1C1C1C",
    textLight: "#E0E0E0",
  };

  return (
    <div
      className="flex flex-col h-full text-white"
      style={{
        backgroundColor: "#1A1F16", // deep greenish-black base
        backgroundImage: `
      linear-gradient(#2E3522 1px, transparent 1px),
      linear-gradient(90deg, #2E3522 1px, transparent 1px)
    `,
        backgroundSize: "50px 50px",
        backgroundBlendMode: "overlay",
        boxShadow: "inset 0 0 50px rgba(0, 0, 0, 0.6)", // adds depth
      }}
    >
      {/* HEADER */}
      <div
        className="text-white p-4 flex items-center justify-between shadow-md"
        style={{ backgroundColor: COLORS.header }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard/group_list")}
          className="mr-3 p-2 rounded-full hover:bg-gray-700 transition"
          style={{ color: COLORS.textLight }}
        >
          <IoArrowBack size={22} />
        </button>

        {/* Group Avatar + Name */}
        {mergedGroupInfo && (
          <div className="flex items-center space-x-4">
            <div
              className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: COLORS.avatar }}
            >
              {mergedGroupInfo?.group_meta?.name?.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2
                  className="text-[16px] font-semibold"
                  style={{ color: COLORS.textLight }}
                >
                  {mergedGroupInfo?.group_meta?.name}
                </h2>
                {connectionStatus === "connected" && (
                  <small className="text-green-400 text-2xl">● </small>
                )}
                {connectionStatus === "error" && (
                  <small className="text-red-400 text-2xl">●</small>
                )}
              </div>
              <p
                className="text-sm opacity-70"
                style={{ color: COLORS.textLight }}
              >
                {mergedGroupInfo?.data?.length || 0}{" "}
                {mergedGroupInfo?.data?.length === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
        )}

        {/* Members Button */}
        <button
          onClick={() => setShowGroupInfo(true)}
          className="ml-auto p-2 rounded-full transition"
          style={{
            backgroundColor: "transparent",
            color: COLORS.textLight,
            hover: { backgroundColor: "rgba(255, 255, 255, 0.1)" },
          }}
        >
          <Users className="h-6 w-6" />
        </button>

        {/* Settings Button */}
        <button
          className="ml-3"
          onClick={() => {
            setShowSettings(true);
          }}
        >
          <FaCog size={24} />
        </button>
      </div>

      {/* MESSAGES AREA */}
      <div
        ref={messageRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        style={{
          backgroundColor: COLORS.messagesBg,
        }}
      >
        {isLoading || isMessagesLoading ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <div
              className="animate-spin rounded-full h-6 w-6 border-b-2"
              style={{ borderColor: COLORS.textLight }}
            ></div>
          </div>
        ) : (
          <GroupMessageList
            messages={messages}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            messagesContainerRef={messageRef}
            participants={mergedGroupInfo?.data}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR - FIXED */}
      <SendMessage
        messageData={{ ...chatMeta, members: mergedGroupInfo?.data }}
        scrollRef={messageRef}
        messagesEndRef={messagesEndRef}
      />

      {/* GROUP INFO MODAL */}
      <GroupChatDetails
        groupInfo={mergedGroupInfo}
        showGroupInfo={showGroupInfo}
        setShowGroupInfo={setShowGroupInfo}
      />
    </div>
  );
};

export default GroupChatInterface;
