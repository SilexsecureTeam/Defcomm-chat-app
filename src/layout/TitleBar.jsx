import { useEffect, useState } from "react";
import { FiX, FiMinus, FiSquare, FiCopy, FiDownload } from "react-icons/fi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import mainLogo from "../assets/logo-icon.png";
import { invoke, isTauri } from "@tauri-apps/api/core";
import {
  writeFile,
  readFile as readBinaryFile,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { onSuccess } from "../utils/notifications/OnSuccess";
import { onFailure } from "../utils/notifications/OnFailure";

export default function TitleBar() {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        setIsMaximized(await appWindow.isMaximized());
      } catch {}
    }
    init();

    const unlisten = appWindow.onResized(async () => {
      try {
        setIsMaximized(await appWindow.isMaximized());
      } catch (err) {
        console.log("onResize Error", err);
      }
    });

    return () => {
      unlisten.then((f) => f()).catch(() => {});
    };
  }, [appWindow]);

  const minimize = async () => {
    try {
      await appWindow.minimize();
    } catch (err) {
      console.error("Minimize failed:", err);
    }
  };

  const toggleMaximize = async () => {
    try {
      const max = await appWindow.isMaximized();
      max ? await appWindow.unmaximize() : await appWindow.maximize();
      setIsMaximized(!max);
    } catch (err) {
      console.error("Toggle maximize failed:", err);
    }
  };

  const close = async () => {
    try {
      await appWindow.close();
    } catch (err) {
      console.error("Close failed:", err);
    }
  };

  async function exportLog() {
    try {
      // 1. Get log bytes from Rust (as number[])
      const logArray = await invoke("download_log");

      // 2. Convert number[] to Uint8Array
      const logBytes = new Uint8Array(logArray);

      // 3. Decode to UTF-8 for console logging
      const logString = new TextDecoder("utf-8").decode(logBytes);

      // 4. Write to Downloads folder (recursive)
      await writeFile(
        "defcomm.log", // path relative to BaseDirectory.Download
        logBytes, // contents
        { baseDir: BaseDirectory.Download, recursive: true } // options
      );

      onSuccess({
        message: "Log Exported",
        success: "The log has been saved to your Downloads folder.",
      });
    } catch (err) {
      console.error("Failed to export log:", err);
      onFailure({
        message: "Export Failed",
        error: "An error occurred while exporting the log. Please try again.",
      });
    }
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100000000] flex items-center justify-between h-10 bg-oliveDark text-white px-4 select-none"
      data-tauri-drag-region
    >
      {/* Left */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: "drag" }}
      >
        <img src={mainLogo} alt="Logo" className="w-6 h-6" />
        <span className="font-medium text-sm">Defcomm Chat</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Export Log */}
        <button
          onClick={exportLog}
          disabled={exporting}
          title="Export logs"
          className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 flex items-center gap-1"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          <FiDownload size={14} />
          {exporting && <span className="text-xs">Saving…</span>}
          {exportStatus === "ok" && (
            <span className="text-green-400 text-xs">✓</span>
          )}
          {exportStatus === "error" && (
            <span className="text-red-400 text-xs">!</span>
          )}
        </button>

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
