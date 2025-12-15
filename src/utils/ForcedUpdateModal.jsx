import Countdown from "react-countdown";
import { parseHtml } from "./formmaters";
import { check } from "@tauri-apps/plugin-updater";
import { useState, useEffect, useRef } from "react";
import { relaunch } from "@tauri-apps/plugin-process";

const ForcedUpdateModal = ({
  version,
  notes,
  deadline,
  isExpired,
  onBypass,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const isMounted = useRef(true); // track if component is mounted

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false; // mark unmounted on cleanup
    };
  }, []);

  const handleUpdate = async () => {
    if (downloading) return;
    setDownloading(true);
    setProgress(0);
    setStatus("Checking for update...");

    try {
      const update = await check();
      if (!update) {
        setStatus("No update available.");
        setDownloading(false);
        return;
      }

      setStatus("Starting download...");
      let downloaded = 0;
      let total = 0;

      await update.downloadAndInstall((event) => {
        if (!isMounted.current) return;

        switch (event.event) {
          case "Started":
            total = event.data.contentLength || 1;
            downloaded = 0;
            setStatus(`Started downloading ${total} bytes`);
            break;

          case "Progress":
            downloaded += event.data.chunkLength || 0;
            const percentage = Math.min(
              Math.round((downloaded / total) * 100),
              100
            );
            setProgress(percentage);
            setStatus(`Downloading... ${percentage}%`);
            break;

          case "Finished":
            setProgress(100);
            setStatus("Download finished. Installing...");
            break;

          case "Error":
            setStatus(`Error: ${event.payload?.message || "Unknown error"}`);
            setDownloading(false);
            break;
        }
      });

      setStatus("Update installed. Restarting app...");
      await relaunch();
    } catch (err) {
      console.error("Update failed:", err);
      if (isMounted.current) {
        setStatus("Update failed. Please try again.");
        setDownloading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 backdrop-blur-sm text-white">
      <div className="w-full max-w-lg rounded-xl border border-gray-400 bg-[#1f2a1f] text-olive-50 shadow-2xl">
        {/* Header */}
        <div className="border-b border-olive-700 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-wide">
            SYSTEM UPDATE REQUIRED
          </h2>
          <p className="text-sm text-oliveGreen">
            Defcomm Secure Communications Platform
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm leading-relaxed text-olive-200">
            A mandatory security update (<strong>v{version}</strong>) is
            available. To maintain operational integrity, this update must be
            installed before the deadline.
          </p>

          {/* Countdown */}
          <div className="rounded-md border border-olive-700 bg-[#151d15] p-4 text-center">
            {!isExpired ? (
              <>
                <p className="mb-1 text-xs uppercase tracking-wider text-olive-400">
                  Time Remaining
                </p>
                <Countdown
                  date={deadline}
                  renderer={({ days, hours, minutes, seconds }) => (
                    <div className="font-mono text-xl text-olive-100">
                      {days}d {hours}h {minutes}m {seconds}s
                    </div>
                  )}
                />
              </>
            ) : (
              <p className="font-semibold text-red-400">
                The mandatory update period has ended. You must update to
                continue using the app.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="max-h-32 overflow-y-auto text-sm text-olive-300">
            <p className="mb-1 font-medium text-olive-200">Release Notes</p>
            {notes ? (
              <div>{parseHtml(notes)}</div>
            ) : (
              <p>No additional details provided.</p>
            )}
          </div>

          {/* Download Progress */}
          {downloading && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-olive h-3 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-olive-300">{status}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-oliveGreen px-6 py-4">
          {!isExpired && (
            <button
              onClick={onBypass}
              disabled={downloading}
              className={`rounded-md border border-gray-400 px-4 py-2 text-sm text-olive-200 hover:bg-olive-800/40 transition ${
                downloading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Continue for now
            </button>
          )}

          <button
            onClick={handleUpdate}
            disabled={downloading}
            className={`ml-auto rounded-md bg-oliveDark px-5 py-2 text-sm font-medium text-white hover:bg-oliveLight transition ${
              downloading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {downloading ? `Updating... ${progress}%` : "Update Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForcedUpdateModal;
