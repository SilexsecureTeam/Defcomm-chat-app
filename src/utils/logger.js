import { invoke } from "@tauri-apps/api/core";
import { writeBinaryFile, BaseDirectory } from "@tauri-apps/plugin-fs";

let initialized = false;
let loggers = null;

export async function initLogging() {
  if (initialized) return;
  initialized = true;

  // Guard: only run inside Tauri
  const { isTauri } = await import("@tauri-apps/api/core");
  if (!(await isTauri())) return;

  // Dynamic import — THIS is the fix
  loggers = await import("@tauri-apps/plugin-log");

  const { trace, error } = loggers;

  function forwardConsole(fn, logger) {
    const original = console[fn];

    console[fn] = (...args) => {
      original(...args);
      Promise.resolve().then(() => {
        try {
          logger(args.map(String).join(" "));
        } catch {}
      });
    };
  }

  forwardConsole("error", error);
  forwardConsole("warn", trace);
  forwardConsole("info", trace);
  forwardConsole("debug", trace);
  forwardConsole("log", trace);

  window.addEventListener("error", (event) => {
    Promise.resolve().then(() => {
      error(`Unhandled error: ${event.message}\n${event.error?.stack ?? ""}`);
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    Promise.resolve().then(() => {
      error(`Unhandled promise rejection: ${String(event.reason)}`);
    });
  });
}
