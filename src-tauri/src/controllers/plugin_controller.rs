#[path = "./plugin_controller/create_plugins_service.rs"]
mod create_plugins_service;
#[path = "./plugin_controller/delete_plugins_service.rs"]
mod delete_plugins_service;
#[path = "./plugin_controller/get_plugins_service.rs"]
mod get_plugins_service;
#[path = "../models/mod_platform.rs"]
mod mod_platform;
#[path = "../models/plugin_format.rs"]
mod plugin_format;
#[path = "./plugin_controller/utils.rs"]
pub mod utils;
#[path = "../services/zip_service.rs"]
mod zip_service;
use create_plugins_service::{create_mod_plugins, create_vst_or_clap_plugins};
use delete_plugins_service::{delete_mod_plugins, delete_vst_or_clap_plugins};
use get_plugins_service::{get_installed_mod_plugins, get_installed_vst_or_clap_plugins};
use plugin_format::PluginFormat;
use serde_json::json;
use std::{collections::HashMap, fs::File};
use thiserror::Error;

use crate::mod_plugin_controller::{self, ssh_service::SshError};

#[derive(Error, Debug)]
pub enum Error {
    #[error("{0}")]
    RequestError(#[from] reqwest::Error),

    #[error("{0}")]
    FileSystemError(#[from] std::io::Error),

    #[error("{0}")]
    VarError(#[from] std::env::VarError),

    #[error("{0}")]
    SshError(#[from] SshError),

    #[error("{0}")]
    ModPluginControllerError(#[from] mod_plugin_controller::Error),

    #[error("Could not find a plugin folder for this operating system and plugin format")]
    NoPluginFolder,

    #[error("Unknown operating system")]
    NoDownloadFile,

    #[error("{0}")]
    SerializationError(#[from] serde_json::Error),
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
pub async fn get_installable_plugins(
    plugin_formats: Vec<String>,
) -> Result<HashMap<String, serde_json::Value>, Error> {
    let file = File::open("dm-plugins.json")?;
    let mut data: HashMap<String, serde_json::Value> = serde_json::from_reader(file)?;

    data.clone().into_keys().for_each(|key| {
        if !plugin_formats.contains(&key) {
            data.remove(&key);
        }
    });

    if plugin_formats.contains(&PluginFormat::ModAudio.to_string()) {
        let result = mod_plugin_controller::establish_connection().await;
        match result {
            Err(SshError::NoConnection) => {
                data.insert("modIsConnected".to_string(), json!(false));
                Ok(())
            }
            _ => {
                data.insert("modIsConnected".to_string(), json!(true));
                result
            }
        }?;
    }

    Ok(data)
}

#[tauri::command]
pub async fn get_installed_plugins(
    plugin_formats: Vec<String>,
    vst3_folder: Option<String>,
    clap_folder: Option<String>,
) -> Result<HashMap<String, serde_json::Value>, Error> {
    let mut installed_plugins: HashMap<String, serde_json::Value> = HashMap::new();
    let installable_plugins = get_installable_plugins(plugin_formats.clone()).await?;

    get_installed_vst_or_clap_plugins(
        &plugin_formats,
        PluginFormat::VST3,
        vst3_folder,
        &installable_plugins,
        &mut installed_plugins,
    )?;

    get_installed_vst_or_clap_plugins(
        &plugin_formats,
        PluginFormat::CLAP,
        clap_folder,
        &installable_plugins,
        &mut installed_plugins,
    )?;

    get_installed_mod_plugins(
        &plugin_formats,
        &installable_plugins,
        &mut installed_plugins,
    )
    .await?;

    Ok(installed_plugins)
}

#[tauri::command]
pub async fn create_plugins(
    plugins: HashMap<String, serde_json::Value>,
    vst3_folder: Option<String>,
    clap_folder: Option<String>,
    mod_platform: Option<String>,
) -> Result<(), Error> {
    create_vst_or_clap_plugins(&plugins, PluginFormat::VST3, vst3_folder).await?;
    create_vst_or_clap_plugins(&plugins, PluginFormat::CLAP, clap_folder).await?;
    if let Some(platform) = mod_platform {
        create_mod_plugins(&plugins, &platform).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_plugins(
    plugins: HashMap<String, serde_json::Value>,
    vst3_folder: Option<String>,
    clap_folder: Option<String>,
) -> Result<(), Error> {
    delete_vst_or_clap_plugins(&plugins, PluginFormat::VST3, vst3_folder).await?;
    delete_vst_or_clap_plugins(&plugins, PluginFormat::CLAP, clap_folder).await?;
    delete_mod_plugins(&plugins).await?;

    Ok(())
}
