import { toast } from "react-toastify";
import {
  FaCommentDots,
  FaPhoneAlt,
  FaUsers,
  FaReply,
  FaAt,
} from "react-icons/fa";
import audioController from "../audioController";
import notificationSound from "../../assets/audio/bell.mp3";
import {
  requestPermission,
  isPermissionGranted,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { listen } from "@tauri-apps/api/event";

export const onNewNotificationToast = async ({
  groupName,
  senderName,
  message,
  type = "message", // "message" | "call"
  onClick = () => {},
  isChatVisible = false,
  tagUser = null,
  tagMess = null,
  myId = null,
}) => {
  const isCall = type === "call";
  const isGroup = Boolean(groupName);
  const isReply = Boolean(tagMess); // <-- reply flag
  const isMention = isGroup && tagUser && tagUser.includes(myId);

  // Play sound
  audioController.playRingtone(notificationSound);

  const safeMessage = !isCall ? "**********" : "📞 Incoming Secure Call";

  // --- SYSTEM NOTIFICATION (Tauri) ---
  try {
    let permission = await isPermissionGranted();
    if (!permission) {
      permission = (await requestPermission()) === "granted";
    }

    if (permission) {
      let title = "";
      let body = "";
      let actions = [];

      if (isCall) {
        title = "📞 Incoming Call";
        body = `${senderName} is calling you`;
        actions = [
          { label: "Accept", action: "accept_call" },
          { label: "Decline", action: "decline_call" },
        ];
      } else if (isMention) {
        title = `💬 ${groupName} (Mention)`;
        body = `${senderName} mentioned you: ${safeMessage}`;
      } else if (isReply) {
        title = `${isGroup ? "↩️ " + groupName : "↩️ New Message"} (Reply)`;
        body = `${senderName} replied${
          tagUser ? ` to ${tagUser}` : ""
        }: ${safeMessage}`;
      } else if (isGroup) {
        title = `👥 ${groupName}`;
        body = `${senderName}: ${safeMessage}`;
      } else {
        title = `💬 New Message`;
        body = `${senderName}: ${safeMessage}`;
      }

      await sendNotification({
        title,
        body,
        icon: isCall ? "icons/call.png" : "icons/message.png",
        actions,
        tag: isGroup ? groupName : senderName,
        renotify: true,
        sound: "../../assets/audio/bell.mp3",
      });
    }
  } catch (err) {
    console.warn("System notification error:", err);
  }

  // --- LISTEN FOR ACTIONS (Only once) ---
  listen("tauri://notification-action", (event) => {
    const { payload } = event;
    if (payload === "accept_call") {
      console.log("Call accepted");
    } else if (payload === "decline_call") {
      console.log("Call declined");
    }
  });

  // --- IN-APP TOAST ---
  const toastComponent = (
    <div
      className={`flex items-start gap-3 cursor-pointer w-[380px] max-w-full p-4 rounded-lg shadow-lg 
        ${
          isMention
            ? "bg-[#2d1f1f] border-red-600"
            : "bg-[#1b1f1b] border-[#3a4a3a]"
        } 
        hover:bg-[#232823] transition`}
      onClick={onClick}
    >
      <div className="flex-shrink-0">
        {isCall ? (
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-900 border border-green-600">
            <FaPhoneAlt className="text-green-400 text-lg" />
          </div>
        ) : isMention ? (
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-900 border border-red-600">
            <FaAt className="text-red-400 text-lg" />
          </div>
        ) : isReply ? (
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-olive-900 border border-olive-600">
            <FaReply className="text-olive-300 text-lg" />
          </div>
        ) : isGroup ? (
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-900 border border-green-600">
            <FaUsers className="text-green-400 text-lg" />
          </div>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-olive-900 border border-olive-600">
            <FaCommentDots className="text-olive-300 text-lg" />
          </div>
        )}
      </div>

      <div className="flex flex-col leading-snug overflow-hidden">
        {isGroup && (
          <p className="text-[12px] uppercase tracking-wide font-bold text-gray-400 mb-1">
            {groupName}
          </p>
        )}

        <div className="flex flex-col">
          <span
            className={`font-semibold text-sm line-clamp-2 ${
              isMention ? "text-red-400" : "text-green-300"
            }`}
          >
            {senderName} {isMention && "(mentioned you)"}
          </span>

          {isReply && (
            <span className="text-xs italic text-gray-400 truncate">
              Replying {tagUser ? `to ${tagUser}` : "to a message"}
            </span>
          )}

          <span className="text-sm text-gray-200 break-words line-clamp-2">
            {safeMessage}
          </span>
        </div>
      </div>
    </div>
  );

  // toast(toastComponent, {
  //   position: "top-right",
  //   autoClose: 5000,
  //   hideProgressBar: true,
  //   closeOnClick: true,
  //   pauseOnHover: true,
  //   draggable: false,
  // });
};
