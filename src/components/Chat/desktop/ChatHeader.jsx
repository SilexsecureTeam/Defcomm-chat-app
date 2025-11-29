import { useContext } from "react";
import { ChatContext } from "../../../context/ChatContext";
import logoIcon from "../../../assets/logo-icon.png";
import { FiInfo } from "react-icons/fi";
import { motion } from "framer-motion";
import { useLocation, useOutletContext } from "react-router-dom";

export default function ChatHeader() {
  const { typingUsers } = useContext(ChatContext);
  const location = useLocation();
  const { setShowRightPanel } = useOutletContext(); // ✅ Get it here
  const chatUserData = location?.state;

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700">
      {chatUserData ? (
        <div className="flex items-center space-x-4">
          <figure className="relative w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-black font-bold">
            <img
              src={
                chatUserData?.image
                  ? `${import.meta.env.VITE_BASE_URL}${chatUserData?.image}`
                  : logoIcon
              }
              alt={chatUserData?.contact_name?.split("")[0]}
              className="rounded-full object-cover w-12 h-12"
            />
            <span
              className={`${
                chatUserData?.contact_status === "active"
                  ? "bg-green-500"
                  : chatUserData?.contact_status === "pending"
                  ? "bg-red-500"
                  : chatUserData?.contact_status === "busy"
                  ? "bg-yellow-400"
                  : "bg-gray-400"
              } w-3 h-3 absolute bottom-[-2%] right-[5%] rounded-full border-[2px] border-white`}
            ></span>
          </figure>
          <div>
            <div className="font-semibold capitalize">
              {chatUserData?.contact_name}
            </div>
            {typingUsers?.[Number(chatUserData?.contact_id)] && (
              <div className="text-green-400 text-sm">Typing...</div>
            )}
          </div>
        </div>
      ) : (
        <p className="font-bold text-lg">Chat</p>
      )}

      {/* ===== TOGGLE RIGHT PANEL ICON ===== */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowRightPanel(true)} // ✅ Works directly now
        className="p-2 rounded-full hover:bg-oliveGreen/80 transition lg:hidden"
        title="View details"
      >
        <FiInfo size={20} />
      </motion.button>
    </div>
  );
}
