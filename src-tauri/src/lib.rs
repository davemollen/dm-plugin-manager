use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};
#[path = "./controllers/mod_plugin_controller.rs"]
mod mod_plugin_controller;
use mod_plugin_controller::{create_mod_plugins, delete_mod_plugin, get_mod_plugins};
#[path = "./controllers/plugin_controller.rs"]
mod plugin_controller;
use plugin_controller::{
    create_plugins, delete_plugins, get_installable_plugins, get_installed_plugins,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .targets([Target::new(TargetKind::Webview)])
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_installable_plugins,
            get_installed_plugins,
            delete_plugins,
            create_plugins,
            get_mod_plugins,
            create_mod_plugins,
            delete_mod_plugin
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
