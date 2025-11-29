import ChatHeader from "../components/Chat/desktop/ChatHeader";
import MessageArea from "../components/Chat/desktop/MessageArea";

export default function SecureChatUI() {
  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader />
      <MessageArea />
    </div>
  );
}
