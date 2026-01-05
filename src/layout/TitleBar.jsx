import { useEffect, useState } from "react";
import { FiX, FiMinus, FiSquare, FiCopy } from "react-icons/fi"; // Added FiCopy for restore icon
import { getCurrentWindow } from "@tauri-apps/api/window";
import mainLogo from "../assets/logo-icon.png";

export default function TitleBar() {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    async function init() {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    }
    init();

    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [appWindow]);

  const minimize = () => appWindow.minimize();
  const toggleMaximize = async () => {
    const max = await appWindow.isMaximized();
    max ? appWindow.unmaximize() : appWindow.maximize();
    setIsMaximized(!max);
  };
  const close = () => appWindow.close();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100000000] flex items-center justify-between h-10 bg-oliveDark text-white px-4 select-none"
      data-tauri-drag-region
    >
      {/* Left: App icon and title */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: "drag" }}
      >
        <img src={mainLogo} alt="Logo" className="w-6 h-6" />
        <span className="font-medium text-sm">Defcomm Chat</span>
      </div>

      {/* Right: Window controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={minimize}
          className="p-2 hover:bg-gray-700 rounded"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          <FiMinus size={14} />
        </button>

        <button
          onClick={toggleMaximize}
          className="p-2 hover:bg-gray-700 rounded"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          {/* Change icon depending on window state */}
          {isMaximized ? <FiCopy size={14} /> : <FiSquare size={14} />}
        </button>

        <button
          onClick={close}
          className="p-2 hover:bg-red-600 rounded"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          <FiX size={14} />
        </button>
      </div>
    </div>
  );
}
