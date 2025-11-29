import { toast } from "react-toastify";
import { FaSignOutAlt } from "react-icons/fa";

export const onLogoutToast = () => {
  const message = "You have been logged out. Please log in again to continue.";

  const toastComponent = (
    <div className="flex items-center gap-3 w-[380px] max-w-full p-4 rounded-lg bg-red-900 border border-red-600 shadow-lg">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-700 border border-red-500">
          <FaSignOutAlt className="text-red-200 text-lg" />
        </div>
      </div>
      <div className="flex flex-col text-red-100">
        <span className="font-semibold text-sm">Session Ended</span>
        <span className="text-xs">{message}</span>
      </div>
    </div>
  );

  toast(toastComponent, {
    position: "top-center",
    autoClose: 4000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: false,
    className: "bg-transparent shadow-none m-2",
  });
};
