#[path = "./mod_plugin_controller/mod_plugin_service.rs"]
mod mod_plugin_service;
#[path = "../models/plugins.rs"]
mod plugins;
#[path = "../services/ssh_service.rs"]
pub mod ssh_service;
use mod_plugin_service::{
    convert_to_path_object, derive_destination_folder_path, extract_root_folder_name,
};
pub use plugins::ArrayBufferWithPath;
pub use ssh_service::{SshError, SshService};
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("{0}")]
    Ssh(#[from] SshError),

    #[error("No plugins could be found.")]
    NoPlugins,
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
pub async fn get_mod_plugins() -> Result<Vec<String>, Error> {
    let ssh_service = SshService::connect("192.168.51.1", "root", "mod").await?;
    let stdout = ssh_service.execute_command("ls .lv2", None).await?;
    if stdout.is_empty() {
        Err(Error::NoPlugins)
    } else {
        let plugins = stdout
            .split("\n")
            .map(|item| item.to_string())
            .filter(|item| !item.is_empty())
            .collect();
        ssh_service.disconnect().await?;
        Ok(plugins)
    }
}

#[tauri::command]
pub async fn create_mod_plugins(files: Vec<ArrayBufferWithPath>) -> Result<Vec<String>, Error> {
    let mut plugin_names: Vec<String> = Vec::new();
    let ssh_service = SshService::connect("192.168.51.1", "root", "mod").await?;

    for file in files {
        let path = &convert_to_path_object(file.path);
        let destination_path = Path::new(".lv2").join(path);
        let destination_folder_path = derive_destination_folder_path(&destination_path);
        let mkdir_command = format!("mkdir -p {}", destination_folder_path);
        let cat_command = format!("cat > {}", destination_path.to_string_lossy());

        ssh_service.execute_command(&mkdir_command, None).await?;
        ssh_service
            .execute_command(&cat_command, Some(&file.buffer))
            .await?;

        let created_plugin_name = extract_root_folder_name(path);
        if !plugin_names.contains(&created_plugin_name) {
            plugin_names.push(created_plugin_name)
        }
    }

    ssh_service.disconnect().await?;

    Ok(plugin_names)
}

#[tauri::command]
pub async fn delete_mod_plugin(name: String) -> Result<(), Error> {
    let ssh_service = SshService::connect("192.168.51.1", "root", "mod").await?;
    ssh_service
        .execute_command(&format!("rm -rf .lv2/{}", name), None)
        .await?;

    Ok(())
}

pub async fn establish_connection() -> Result<(), SshError> {
    SshService::connect("192.168.51.1", "root", "mod").await?;

    Ok(())
}
