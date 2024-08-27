#[path = "../services/ssh_service.rs"]
mod ssh_service;
use serde::Deserialize;
use ssh_service::{SshError, SshService};
use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Deserialize, Debug, Clone)]
pub struct File {
    path: String,
    buffer: Vec<u8>,
}

#[derive(Error, Debug)]
pub enum ModPluginControllerError {
    #[error("{0}")]
    SshError(#[from] SshError),

    #[error("No plugins could be found.")]
    NotFound,
}

impl serde::Serialize for ModPluginControllerError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
pub async fn get_mod_plugins() -> Result<Vec<String>, ModPluginControllerError> {
    let ssh_service = SshService::connect("192.168.51.1", "root", "mod").await?;
    let stdout = ssh_service.execute_command("ls .lv2", None).await?;
    if stdout.is_empty() {
        Err(ModPluginControllerError::NotFound)
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
pub async fn create_mod_plugins(files: Vec<File>) -> Result<Vec<String>, ModPluginControllerError> {
    let mut plugin_names: Vec<String> = Vec::new();
    let ssh_service = SshService::connect("192.168.51.1", "root", "mod").await?;

    for file in files {
        let path = &convert_to_path_object(file.path);
        let destination_path = Path::new(".lv2").join(path);
        let destination_folder_path = derive_destination_folder_path(&destination_path);
        let mkdir_command = format!("mkdir -p {}", destination_folder_path);
        ssh_service.execute_command(&mkdir_command, None).await?;

        let cat_command = format!("cat > {}", destination_path.to_str().unwrap());
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
pub async fn delete_mod_plugin(name: String) -> Result<(), ModPluginControllerError> {
    let ssh_service = SshService::connect("192.168.51.1", "root", "mod").await?;
    ssh_service
        .execute_command(&format!("rm -rf .lv2/{}", name), None)
        .await?;

    Ok(())
}

fn convert_to_path_object(path: String) -> PathBuf {
    Path::new(if path.starts_with("/") {
        &path[1..]
    } else {
        &path
    })
    .to_path_buf()
}

fn derive_destination_folder_path(destination_path: &Path) -> String {
    destination_path
        .ancestors()
        .nth(1)
        .unwrap()
        .to_str()
        .unwrap()
        .to_string()
}

fn extract_root_folder_name(path: &Path) -> String {
    let mut ancestors = path.ancestors();
    let root = ancestors.nth(ancestors.count() - 2).unwrap();
    root.file_name().unwrap().to_str().unwrap().to_string()
}
