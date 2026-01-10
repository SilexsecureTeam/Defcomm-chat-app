use dirs::data_local_dir;
use log::LevelFilter;
use std::path::PathBuf;
use tauri::{AppHandle, Listener, Manager};
use tauri_plugin_log::{Builder as LogBuilder, Target, TargetKind};

#[tauri::command]
fn get_log_path(_app: AppHandle) -> Option<String> {
    // Use OS-specific local app data folder
    let mut log_dir: PathBuf = data_local_dir()?;

    // Add your app bundle identifier or name
    log_dir.push("ng.defcomm.chat"); // <-- replace with your bundle ID
    log_dir.push("logs"); // folder for logs
    let log_file = log_dir.join("defcomm.log");

    Some(log_file.to_string_lossy().to_string())
}

#[tauri::command]
fn download_log(app: tauri::AppHandle) -> Result<Vec<u8>, String> {
    let log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
    let log_file = log_dir.join("defcomm.log");

    if !log_file.exists() {
        return Err(format!("Log file not found: {}", log_file.display()));
    }

    std::fs::read(log_file).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Create the log plugin
    let log_plugin = LogBuilder::new()
        // Write logs to OS-specific log directory
        .target(Target::new(TargetKind::LogDir {
            file_name: Some("defcomm.log".into()),
        }))
        // Also print logs to stdout (optional, useful in dev)
        .target(Target::new(TargetKind::Stdout))
        // Log level
        .level(LevelFilter::Info)
        // Keep all log files instead of discarding on size limit
        //.rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
        .build();

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(log_plugin)
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_log_path, download_log])
        .setup(|app| {
            let splashscreen = app.get_webview_window("splashscreen").unwrap();
            let main_window = app.get_webview_window("main").unwrap();

            // enforce minimum size
            use tauri::{LogicalSize, Size};
            main_window.set_min_size(Some(Size::Logical(LogicalSize {
                width: 600.0,
                height: 400.0,
            })))?;

            // ✅ Center and show splashscreen after small delay
            splashscreen.center()?;
            main_window.center()?;
            let splashscreen_clone = splashscreen.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(200));
                splashscreen_clone.show().unwrap();
            });

            // ✅ When frontend is ready, show main window after 3 seconds
            let app_handle = app.handle();
            let splash_for_listener = splashscreen.clone();
            let main_for_listener = main_window.clone();

            app_handle.listen("frontend-ready", move |_event| {
                // Clone again so the thread owns its own copies
                let splash_to_close = splash_for_listener.clone();
                let main_to_show = main_for_listener.clone();

                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(3));
                    main_to_show.show().unwrap();
                    splash_to_close.close().unwrap();
                });
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
