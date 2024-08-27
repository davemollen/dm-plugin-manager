use tauri::api::os::platform;

const VST3_MAC_PATH: String = "~/Library/Audio/Plug-Ins/VST3";
const CLAP_MAC_PATH: String = "~/Library/Audio/Plug-Ins/CLAP";
const VST3_WINDOWS_PATH: String = "C:/Program Files/Common Files/VST3/";
const CLAP_WINDOWS_PATH: String = "C:/Program Files/Common Files/CLAP/";
const VST3_LINUX_PATH: String = "~/.vst3";
const CLAP_LINUX_PATH: String = "~/.clap";

#[tauri::command]
async fn get_plugins(formats: Vec<String>) -> Result<(), String> {}

struct Plugin {
    name: String,
    format: String,
    mod_platform: Some<String>,
}

#[tauri::command]
async fn create_plugins(plugins: Vec<Plugin>) -> Result<(), String> {}

#[tauri::command]
async fn delete_plugins(plugins: Vec<Plugin>) -> Result<(), String> {}

fn get_os_type() -> String {
    platform.to_string()
}
