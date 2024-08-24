use futures::future::try_join_all;
use serde::Deserialize;
use std::path::Path;
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};
#[path = "./services/russh_service.rs"]
mod ssh_service;
use ssh_service::{SshError, SshService};

#[tauri::command]
async fn get_plugins() -> Result<Vec<String>, SshError> {
    let mut ssh_service = SshService::new();
    ssh_service.connect("192.168.51.1", "root", "mod").await?;
    if let Some(response) = ssh_service.execute_command("ls .lv2").await? {
        let plugins = response.split("\n").map(|item| item.to_string()).collect();
        ssh_service.disconnect().await?;
        Ok(plugins)
    } else {
        Err(SshError::Other("No plugins could be found.".to_string()))
    }
}

#[derive(Deserialize, Debug, Clone)]
struct File {
    path: String,
    buffer: Vec<u8>,
}

#[tauri::command]
async fn create_plugins(files: Vec<File>) -> Result<Vec<String>, SshError> {
    let mut ssh_service = SshService::new();
    ssh_service.connect("192.168.51.1", "root", "mod").await?;

    let futures: Vec<_> = files
        .clone()
        .into_iter()
        .map(|file| {
            let path = Path::new(if file.path.starts_with("/") {
                &file.path[1..]
            } else {
                &file.path
            });
            let destination_path = Path::new(".lv2").join(path);
            let destination_folder_path = destination_path
                .ancestors()
                .nth(1)
                .unwrap()
                .to_str()
                .unwrap();
            let command = format!("mkdir -p {}", destination_folder_path);

            println!("command: {}", command);

            let mut ssh_service = ssh_service.clone();
            async move {
                // ssh_service.execute_command(&command).await?;
                Ok::<(), SshError>(())
            }
        })
        .collect();

    // If any future returns an error, the whole operation will fail
    try_join_all(futures).await?;

    ssh_service.disconnect().await?;

    let plugin_names = files.clone().iter().fold(Vec::new(), |mut result, file| {
        let path = Path::new(&file.path);
        let mut ancestors = path.ancestors();
        let root = ancestors.nth(ancestors.count() - 2).unwrap();
        let file_name = root.file_name().unwrap().to_str().unwrap().to_string();

        if !result.contains(&file_name) {
            result.push(file_name)
        }

        result
    });

    Ok(plugin_names)
}

#[tauri::command]
async fn delete_plugin(name: String) -> Result<(), SshError> {
    let mut ssh_service = SshService::new();
    ssh_service
        .connect("192.168.51.1:22", "root", "mod")
        .await?;
    ssh_service
        .execute_command(format!("rf -rf .lv2/{name}").as_str())
        .await?;

    Ok(())
}

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
        .plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .targets([Target::new(TargetKind::Webview)])
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_plugins,
            create_plugins,
            delete_plugin
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
