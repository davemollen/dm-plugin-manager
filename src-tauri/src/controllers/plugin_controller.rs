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
#[path = "../models/plugins.rs"]
mod plugins;
#[path = "./plugin_controller/utils.rs"]
pub mod utils;
#[path = "../services/zip_service.rs"]
mod zip_service;
use create_plugins_service::{
    create_mod_plugins, create_plugin_folders_on_mac_os, create_vst_or_clap_plugins,
};
use delete_plugins_service::{delete_mod_plugins, delete_vst_or_clap_plugins};
use get_plugins_service::{get_installed_mod_plugins, get_installed_vst_or_clap_plugins};
use mod_platform::ModPlatform;
use plugin_format::PluginFormat;
use plugins::{GetPluginsResponse, PluginsConfig, SelectedPlugins};
use std::fs::File;
use tauri::{path::BaseDirectory, utils::platform::Target, Manager};
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
    TauriError(#[from] tauri::Error),

    #[error("{0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Unable to create directory: {0}")]
    CreateDirectoryError(String),
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
    mod_platform: Option<ModPlatform>,
    handle: tauri::AppHandle,
) -> Result<GetPluginsResponse, Error> {
    let file_path = handle
        .path()
        .resolve("resources/dm-plugins.json", BaseDirectory::Resource)?;
    let file = File::open(&file_path)?;
    let config: PluginsConfig = serde_json::from_reader(file)?;
    let mut response = GetPluginsResponse::default();

    if plugin_formats.contains(&PluginFormat::VST3.to_string()) {
        response.vst3 = config.vst3;
    }

    if plugin_formats.contains(&PluginFormat::CLAP.to_string()) {
        response.clap = config.clap;
    }

    if plugin_formats.contains(&PluginFormat::ModAudio.to_string()) {
        match mod_platform {
            Some(ModPlatform::Duo) => response.mod_audio = config.mod_audio.duo,
            Some(ModPlatform::DuoX) => response.mod_audio = config.mod_audio.duo_x,
            Some(ModPlatform::Dwarf) => response.mod_audio = config.mod_audio.dwarf,
            None => (),
        };
    }

    if plugin_formats.contains(&PluginFormat::ModAudio.to_string()) {
        let result = mod_plugin_controller::establish_connection().await;
        match result {
            Err(SshError::NoConnection) => {
                response.mod_is_connected = false;
                Ok(())
            }
            _ => {
                response.mod_is_connected = true;
                result
            }
        }?;
    }

    Ok(response)
}

#[tauri::command]
pub async fn get_installed_plugins(
    plugin_formats: Vec<String>,
    vst3_folder: Option<String>,
    clap_folder: Option<String>,
    mod_platform: Option<ModPlatform>,
    handle: tauri::AppHandle,
) -> Result<GetPluginsResponse, Error> {
    let mut installed_plugins = GetPluginsResponse::default();
    let installable_plugins =
        get_installable_plugins(plugin_formats.clone(), mod_platform, handle).await?;

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
    plugins: SelectedPlugins,
    vst3_folder: Option<String>,
    clap_folder: Option<String>,
    mod_platform: Option<String>,
) -> Result<(), Error> {
    create_plugin_folders_on_mac_os(&plugins, &vst3_folder, &clap_folder)?;
    create_vst_or_clap_plugins(plugins.vst3, PluginFormat::VST3, vst3_folder).await?;
    create_vst_or_clap_plugins(plugins.clap, PluginFormat::CLAP, clap_folder).await?;
    if let Some(platform) = mod_platform {
        create_mod_plugins(plugins.mod_audio, &platform).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_plugins(
    plugins: SelectedPlugins,
    vst3_folder: Option<String>,
    clap_folder: Option<String>,
) -> Result<(), Error> {
    delete_vst_or_clap_plugins(plugins.vst3, PluginFormat::VST3, vst3_folder).await?;
    delete_vst_or_clap_plugins(plugins.clap, PluginFormat::CLAP, clap_folder).await?;
    delete_mod_plugins(plugins.mod_audio).await?;

    Ok(())
}
