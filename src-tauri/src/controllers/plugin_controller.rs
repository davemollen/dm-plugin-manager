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
use create_plugins_service::{create_mod_plugin, create_plugin};
use delete_plugins_service::delete_plugin;
use futures::future::try_join_all;
use get_plugins_service::plugin_exists;
use plugin_format::PluginFormat;
use serde_json::{json, Map, Value};
use std::{collections::HashMap, path::PathBuf};
use thiserror::Error;
use utils::{get_plugin_bundle_name, get_plugin_folder};

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

    #[error("Unknown plugin format")]
    NoPluginFormat,
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
    // TODO make new api to checks what plugins are available
    let mut data: HashMap<String, serde_json::Value> = HashMap::new();

    if plugin_formats.contains(&"VST3".to_string()) {
        // Adding the "VST3" entry
        let vst3 = vec!["dm-Stutter".to_string(), "dm-Whammy".to_string()];
        data.insert("VST3".to_string(), json!(vst3));
    }
    if plugin_formats.contains(&"CLAP".to_string()) {
        // Adding the "CLAP" entry
        let clap = vec!["dm-Stutter".to_string(), "dm-Whammy".to_string()];
        data.insert("CLAP".to_string(), json!(clap));
    }
    if plugin_formats.contains(&"MOD Audio".to_string()) {
        let mut mod_audio: HashMap<String, Vec<String>> = HashMap::new();
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
        mod_audio.insert(
            "Dwarf".to_string(),
            vec!["dm-LFO".to_string(), "dm-Stutter".to_string()],
        );
        mod_audio.insert("Duo".to_string(), vec!["dm-LFO".to_string()]);

        // Adding the "MOD Audio" entry
        data.insert("MOD Audio".to_string(), json!(mod_audio));
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

    if plugin_formats.contains(&"VST3".to_string()) {
        if let Some(vst3_value) = installable_plugins.get("VST3") {
            if let Value::Array(plugins) = vst3_value {
                if !plugins.is_empty() {
                    let plugin_folder = if let Some(vst3_folder) = vst3_folder {
                        PathBuf::from(vst3_folder)
                    } else {
                        get_plugin_folder(PluginFormat::VST3)?
                    };

                    let found_plugins: Vec<Value> = plugins
                        .iter()
                        .filter(|plugin| {
                            if let Some(plugin_name) = plugin.as_str() {
                                plugin_exists(&plugin_folder, plugin_name, &PluginFormat::VST3)
                                    .unwrap_or(false)
                            } else {
                                false
                            }
                        })
                        .map(|item| item.to_owned())
                        .collect();

                    installed_plugins.insert("VST3".to_string(), Value::Array(found_plugins));
                }
            }
        }
    }

    if plugin_formats.contains(&"CLAP".to_string()) {
        if let Some(clap_value) = installable_plugins.get("CLAP") {
            if let Value::Array(plugins) = clap_value {
                if !plugins.is_empty() {
                    let plugin_folder = if let Some(clap_folder) = clap_folder {
                        PathBuf::from(clap_folder)
                    } else {
                        get_plugin_folder(PluginFormat::CLAP)?
                    };

                    let found_plugins: Vec<Value> = plugins
                        .iter()
                        .filter(|plugin| {
                            if let Some(plugin_name) = plugin.as_str() {
                                plugin_exists(&plugin_folder, plugin_name, &PluginFormat::CLAP)
                                    .unwrap_or(false)
                            } else {
                                false
                            }
                        })
                        .map(|item| item.to_owned())
                        .collect();

                    installed_plugins.insert("CLAP".to_string(), Value::Array(found_plugins));
                }
            }
        }
    }

    if plugin_formats.contains(&"MOD Audio".to_string()) {
        if let Some(mod_value) = installable_plugins.get("MOD Audio") {
            if let Value::Object(mod_map) = mod_value {
                for (platform, value) in mod_map {
                    if let Value::Array(plugins) = value {
                        installed_plugins
                            .insert("MOD Audio".to_string(), Value::Object(Map::new()));

                        if !plugins.is_empty() {
                            let result = mod_plugin_controller::get_mod_plugins().await;
                            let all_plugins = match result {
                                Err(mod_plugin_controller::Error::Ssh(SshError::NoConnection)) => {
                                    installed_plugins
                                        .insert("modIsConnected".to_string(), json!(false));
                                    return Ok(installed_plugins);
                                }
                                _ => {
                                    installed_plugins
                                        .insert("modIsConnected".to_string(), json!(true));
                                    result
                                }
                            }?;

                            let found_plugins: Vec<Value> = plugins
                                .iter()
                                .filter(|plugin| {
                                    if let Some(plugin_name) = plugin.as_str() {
                                        match get_plugin_bundle_name(
                                            plugin_name,
                                            &PluginFormat::ModAudio,
                                        ) {
                                            Ok(bundle_name) => all_plugins.contains(&bundle_name),
                                            Err(_) => false,
                                        }
                                    } else {
                                        false
                                    }
                                })
                                .map(|item| item.to_owned())
                                .collect();

                            let mut installable_mod_map = Map::new();
                            installable_mod_map
                                .insert(platform.to_string(), Value::Array(found_plugins));
                            installed_plugins.insert(
                                "MOD Audio".to_string(),
                                Value::Object(installable_mod_map),
                            );
                        }
                    }
                }
            }
        }
    }

    Ok(installed_plugins)
}

#[tauri::command]
pub async fn create_plugins(
    plugins: HashMap<String, serde_json::Value>,
    vst3_folder: Option<String>,
    clap_folder: Option<String>,
) -> Result<(), Error> {
    if let Some(vst3_value) = plugins.get("VST3") {
        if let Value::Array(plugins) = vst3_value {
            if !plugins.is_empty() {
                let plugin_folder = if let Some(vst3_folder) = vst3_folder {
                    PathBuf::from(vst3_folder)
                } else {
                    get_plugin_folder(PluginFormat::VST3)?
                };

                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| {
                        let plugin_folder = plugin_folder.clone();
                        async move {
                            let plugin_name = plugin.as_str().unwrap();
                            println!("Started installing VST3 plugin: {}", plugin_name);
                            create_plugin(&plugin_folder, plugin_name, PluginFormat::VST3).await?;
                            println!("Finished installing VST3 plugin: {}", plugin_name);

                            Ok::<(), Error>(())
                        }
                    })
                    .collect();

                try_join_all(futures).await?;
            }
        }
    }

    if let Some(clap_value) = plugins.get("CLAP") {
        if let Value::Array(plugins) = clap_value {
            if !plugins.is_empty() {
                let plugin_folder = if let Some(clap_folder) = clap_folder {
                    PathBuf::from(clap_folder)
                } else {
                    get_plugin_folder(PluginFormat::CLAP)?
                };

                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| {
                        let plugin_folder = plugin_folder.clone();
                        async move {
                            let plugin_name = plugin.as_str().unwrap();
                            println!("Started installing CLAP plugin: {}", plugin_name);
                            create_plugin(&plugin_folder, plugin_name, PluginFormat::CLAP).await?;
                            println!("Finished installing CLAP plugin: {}", plugin_name);

                            Ok::<(), Error>(())
                        }
                    })
                    .collect();

                try_join_all(futures).await?;
            }
        }
    }

    if let Some(mod_value) = plugins.get("MOD Audio") {
        if let Value::Object(mod_map) = mod_value {
            for (platform, value) in mod_map {
                if let Value::Array(plugins) = value {
                    if !plugins.is_empty() {
                        let futures: Vec<_> = plugins
                            .iter()
                            .map(|plugin| async move {
                                let plugin_name = plugin.as_str().unwrap();
                                println!(
                                    "Started installing MOD {} plugin: {}",
                                    platform, plugin_name
                                );
                                create_mod_plugin(plugin_name, platform).await?;
                                println!(
                                    "Finished installing MOD {} plugin: {}",
                                    platform, plugin_name
                                );

                                Ok::<(), Error>(())
                            })
                            .collect();

                        try_join_all(futures).await?;
                    }
                }
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_plugins(
    plugins: HashMap<String, serde_json::Value>,
    vst3_folder: Option<String>,
    clap_folder: Option<String>,
) -> Result<(), Error> {
    if let Some(vst3_value) = plugins.get("VST3") {
        if let Value::Array(plugins) = vst3_value {
            if !plugins.is_empty() {
                let plugin_folder = if let Some(vst3_folder) = vst3_folder {
                    PathBuf::from(vst3_folder)
                } else {
                    get_plugin_folder(PluginFormat::VST3)?
                };

                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| {
                        let plugin_folder = plugin_folder.clone();
                        async move {
                            let plugin_name = plugin.as_str().unwrap();
                            println!("Started uninstalling VST3 plugin: {}", plugin_name);
                            delete_plugin(&plugin_folder, plugin_name, &PluginFormat::VST3).await?;
                            println!("Finished uninstalling VST3 plugin: {}", plugin_name);

                            Ok::<(), Error>(())
                        }
                    })
                    .collect();

                try_join_all(futures).await?;
            }
        }
    }

    if let Some(clap_value) = plugins.get("CLAP") {
        if let Value::Array(plugins) = clap_value {
            if !plugins.is_empty() {
                let plugin_folder = if let Some(clap_folder) = clap_folder {
                    PathBuf::from(clap_folder)
                } else {
                    get_plugin_folder(PluginFormat::CLAP)?
                };

                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| {
                        let plugin_folder = plugin_folder.clone();
                        async move {
                            let plugin_name = plugin.as_str().unwrap();
                            println!("Started uninstalling CLAP plugin: {}", plugin_name);
                            delete_plugin(&plugin_folder, plugin_name, &PluginFormat::CLAP).await?;
                            println!("Finished uninstalling CLAP plugin: {}", plugin_name);

                            Ok::<(), Error>(())
                        }
                    })
                    .collect();

                try_join_all(futures).await?;
            }
        }
    }

    if let Some(mod_value) = plugins.get("MOD Audio") {
        if let Value::Object(mod_map) = mod_value {
            for (platform, value) in mod_map {
                if let Value::Array(plugins) = value {
                    if !plugins.is_empty() {
                        let futures: Vec<_> = plugins
                            .iter()
                            .map(|plugin| async move {
                                let plugin_name = plugin.as_str().unwrap();
                                let bundle_name =
                                    get_plugin_bundle_name(plugin_name, &PluginFormat::ModAudio)?;
                                println!(
                                    "Started uninstalling MOD {} plugin: {}",
                                    platform, plugin_name
                                );
                                mod_plugin_controller::delete_mod_plugin(bundle_name).await?;
                                println!(
                                    "Finished uninstalling MOD {} plugin: {}",
                                    platform, plugin_name
                                );

                                Ok::<(), Error>(())
                            })
                            .collect();

                        try_join_all(futures).await?;
                    }
                }
            }
        }
    }

    Ok(())
}
