import mainLogo from "../../../assets/logo-icon.png";
import { useNavigate, useLocation } from "react-router-dom";
import { BiSolidMessageSquareDetail } from "react-icons/bi";
import { RiGroup3Line } from "react-icons/ri";
import { AiOutlineVideoCamera } from "react-icons/ai";
import { IoCallOutline, IoSettingsOutline } from "react-icons/io5";
import { useContext, useState, useEffect } from "react";
import { ChatContext } from "../../../context/ChatContext";
import { FaWalkieTalkie } from "react-icons/fa6";

export default function Sidebar({ onMessageClick, showChatList }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("msg");

  const {
    setShowSettings,
    setShowCall,
    setCallType,
    setShowContactModal,
    setModalTitle,
    selectedChatUser,
  } = useContext(ChatContext);

  // detect active chat route (e.g., /dashboard/chat/:id)
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
      disabled: !selectedChatUser,
    },
    {
      id: "call",
      icon: <IoCallOutline size={20} />,
      disabled: !selectedChatUser,
    },
    { id: "walkie", icon: <FaWalkieTalkie size={20} /> },
    { id: "settings", icon: <IoSettingsOutline size={20} /> },
  ];

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
    </div>
  );
}
