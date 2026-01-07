import mainLogo from "../../../assets/logo-icon.png";
import { useNavigate, useLocation } from "react-router-dom";
import { BiSolidMessageSquareDetail } from "react-icons/bi";
import { RiGroup3Line } from "react-icons/ri";
import { AiOutlineVideoCamera } from "react-icons/ai";
import {
  IoCallOutline,
  IoLogOutOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { useContext, useState, useEffect } from "react";
import { ChatContext } from "../../../context/ChatContext";
import { FaWalkieTalkie } from "react-icons/fa6";
import useAuth from "../../../hooks/useAuth";
export default function Sidebar({ onMessageClick, showChatList }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("msg");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { logout, isLoading } = useAuth();
  const {
    setShowSettings,
    setShowCall,
    setCallType,
    setShowContactModal,
    setModalTitle,
    selectedChatUser,
  } = useContext(ChatContext);

  const onChatPage =
    location.pathname === "/dashboard" || location.pathname.includes("/chat");

  // update active icon when route changes
  useEffect(() => {
    if (location.pathname.includes("/dashboard/comm")) {
      setActive("walkie");
    } else if (location.pathname.includes("/dashboard/chat")) {
      setActive("msg");
    }
  }, [location.pathname]);

  const handleClick = (id) => {
    const isSmallScreen = window.innerWidth < 768;

    // go back to chat list on small screen
    if (id === "msg") {
      if (location.pathname.includes("/dashboard/comm")) {
        navigate("/");
        return;
      }
      if (isSmallScreen && onMessageClick) {
        onMessageClick();
        return;
      }
    }

    // block call if not in a chat
    if ((id === "video" || id === "call") && !onChatPage) {
      alert("You can only start a call from an active chat.");
      return;
    }

    setActive(id);

    switch (id) {
      case "group":
        setShowContactModal(true);
        break;
      case "video":
        setModalTitle("Place a Call");
        setShowCall(true);
        setCallType("video");
        break;
      case "call":
        setModalTitle("Place a Call");
        setShowCall(true);
        break;
      case "walkie":
        navigate("/dashboard/comm");
        break;
      case "settings":
        setShowSettings(true);
        break;
      default:
        break;
    }
  };

  const icons = [
    { id: "msg", icon: <BiSolidMessageSquareDetail size={20} /> },
    { id: "group", icon: <RiGroup3Line size={20} /> },
    {
      id: "video",
      icon: <AiOutlineVideoCamera size={20} />,
      disabled: selectedChatUser?.type !== "user",
    },
    {
      id: "call",
      icon: <IoCallOutline size={20} />,
      disabled: selectedChatUser?.type !== "user",
    },
    { id: "walkie", icon: <FaWalkieTalkie size={20} /> },
    { id: "settings", icon: <IoSettingsOutline size={20} /> },
  ];

  const handleLogout = () => {
    if (isLoading.logout) return;
    logout("current");
  };

  return (
    <div className="w-20 bg-transparent flex flex-col items-center py-4 space-y-6">
      <img src={mainLogo} alt="logo" className="w-14" />
      <div className="flex-1 flex flex-col justify-center items-center py-4 space-y-6">
        {icons.map(({ id, icon, disabled }) => {
          const isSmallScreen = window.innerWidth < 768;
          const isActive =
            isSmallScreen && id === "msg" ? showChatList : active === id;

          return (
            <p
              key={id}
              onClick={() => !disabled && handleClick(id)}
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                disabled
                  ? "opacity-50 cursor-not-allowed hidden"
                  : isActive
                  ? "bg-white text-olive"
                  : "hover:bg-white hover:text-olive text-white"
              }`}
            >
              {icon}
            </p>
          );
        })}
      </div>
      <div className="pb-4">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="p-2 rounded-lg text-white hover:bg-white hover:text-olive transition-all"
        >
          <IoLogOutOutline size={22} />
        </button>
      </div>
      {showLogoutModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <IoLogOutOutline size={20} />
              </div>

              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">
                  Log out of Defcomm
                </h3>
                <p className="text-sm text-gray-500">
                  This will end your current session
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 text-sm text-gray-600">
              Are you sure you want to log out? You will need to sign in again
              to access your messages and calls.
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button
                disabled={isLoading.logout}
                onClick={() => !isLoading.logout && setShowLogoutModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition
      ${
        isLoading.logout
          ? "border-gray-200 text-gray-400 cursor-not-allowed"
          : "border-gray-300 text-gray-700 hover:bg-gray-100"
      }`}
              >
                Cancel
              </button>

              <button
                disabled={isLoading.logout}
                onClick={handleLogout}
                className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition flex items-center gap-2
      ${
        isLoading.logout
          ? "bg-red-400 cursor-not-allowed"
          : "bg-red-600 hover:bg-red-700"
      }`}
              >
                {isLoading.logout ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging out…
                  </>
                ) : (
                  "Log out"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
