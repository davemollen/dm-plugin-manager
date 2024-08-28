#[path = "../services/zip_service.rs"]
mod zip_service;
use futures::future::join_all;
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    fs::{self, File},
    io,
    path::{Path, PathBuf},
};
use tauri::utils::platform;
use thiserror::Error;
use zip_service::ZipService;

#[derive(Error, Debug)]
pub enum PluginControllerError {
    #[error("{0}")]
    RequestError(#[from] reqwest::Error),

    #[error("{0}")]
    FileSystemError(#[from] std::io::Error),

    #[error("{0}")]
    VarError(#[from] std::env::VarError),

    #[error("Could not find a plugin folder for this operating system and plugin format.")]
    PluginFolderNotFound,

    #[error("Unknown operating system")]
    UnknownOS,

    #[error("{0}")]
    Other(String),
}

impl serde::Serialize for PluginControllerError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
pub fn get_plugins(mode: String) -> Result<HashMap<String, serde_json::Value>, String> {
    // make api call
    // the api checks what plugins are available
    let mut data: HashMap<String, serde_json::Value> = HashMap::new();

    let mut mod_audio: HashMap<String, Vec<String>> = HashMap::new();
    mod_audio.insert(
        "Dwarf".to_string(),
        vec!["dm-LFO".to_string(), "dm-Stutter".to_string()],
    );
    mod_audio.insert("Duo".to_string(), vec!["dm-LFO".to_string()]);

    // Adding the "MOD Audio" entry
    data.insert("MOD Audio".to_string(), json!(mod_audio));

    // Adding the "VST3" entry
    let vst3 = vec!["dm-Stutter".to_string(), "dm-Whammy".to_string()];
    data.insert("VST3".to_string(), json!(vst3));

    // Adding the "CLAP" entry
    let clap = vec!["dm-Stutter".to_string(), "dm-Whammy".to_string()];
    data.insert("CLAP".to_string(), json!(clap));

    Ok(data)
}

#[tauri::command]
pub async fn create_plugins(
    plugins: HashMap<String, serde_json::Value>,
) -> Result<(), PluginControllerError> {
    if let Some(mod_audio_value) = plugins.get("MOD Audio") {
        if let Value::Object(mod_audio_map) = mod_audio_value {
            for (key, value) in mod_audio_map {
                if let Value::Array(plugins) = value {
                    if plugins.len() > 0 {
                        println!("{}: {:?}", key, plugins);
                        // Download file
                        // Read just the array buffer
                        // Call the create_mod_plugin method of the other controller for each plugin
                    }
                }
            }
        }
    }

    if let Some(vst3_value) = plugins.get("VST3") {
        if let Value::Array(plugins) = vst3_value {
            if plugins.len() > 0 {
                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| async move {
                        let plugin_name = plugin.as_str().unwrap();
                        println!("Started installing VST3 plugin: {}", plugin_name);
                        create_plugin(plugin_name, "VST3").await?;
                        println!("Finished installing VST3 plugin: {}", plugin_name);

                        Ok::<(), PluginControllerError>(())
                    })
                    .collect();

                join_all(futures).await;
            }
        }
    }

    if let Some(clap_value) = plugins.get("CLAP") {
        if let Value::Array(plugins) = clap_value {
            if plugins.len() > 0 {
                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| async move {
                        let plugin_name = plugin.as_str().unwrap();
                        println!("Started installing CLAP plugin: {}", plugin_name);
                        create_plugin(plugin_name, "CLAP").await?;
                        println!("Finished installing CLAP plugin: {}", plugin_name);

                        Ok::<(), PluginControllerError>(())
                    })
                    .collect();

                join_all(futures).await;
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_plugins(
    plugins: HashMap<String, serde_json::Value>,
) -> Result<(), PluginControllerError> {
    if let Some(mod_audio_value) = plugins.get("MOD Audio") {
        if let Value::Object(mod_audio_map) = mod_audio_value {
            for (key, value) in mod_audio_map {
                if let Value::Array(plugins) = value {
                    if plugins.len() > 0 {
                        println!("{}: {:?}", key, plugins);
                    }
                }
            }
        }
    }

    if let Some(vst3_value) = plugins.get("VST3") {
        if let Value::Array(plugins) = vst3_value {
            if plugins.len() > 0 {
                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| async move {
                        let plugin_name = plugin.as_str().unwrap();
                        println!("Started uninstalling VST3 plugin: {}", plugin_name);
                        delete_plugin(plugin_name, "VST3").await?;
                        println!("Finished uninstalling VST3 plugin: {}", plugin_name);

                        Ok::<(), PluginControllerError>(())
                    })
                    .collect();

                join_all(futures).await;
            }
        }
    }

    if let Some(clap_value) = plugins.get("CLAP") {
        if let Value::Array(plugins) = clap_value {
            if plugins.len() > 0 {
                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| async move {
                        let plugin_name = plugin.as_str().unwrap();
                        println!("Started uninstalling CLAP plugin: {}", plugin_name);
                        delete_plugin(plugin_name, "CLAP").await?;
                        println!("Finished uninstalling CLAP plugin: {}", plugin_name);

                        Ok::<(), PluginControllerError>(())
                    })
                    .collect();

                join_all(futures).await;
            }
        }
    }

    Ok(())
}

async fn create_plugin(
    plugin_name: &str,
    plugin_format: &str,
) -> Result<(), PluginControllerError> {
    let plugin_folder = get_plugin_folder(plugin_format)?;
    let plugin_file_name = get_plugin_file_name(plugin_name, plugin_format)?;
    let plugin_path = plugin_folder.join(&plugin_file_name);
    let zipfile_path = download_zip_file(plugin_name).await?;
    let unzipped_folder = zipfile_path.with_extension("");
    println!("Zipfile path: {}", zipfile_path.to_string_lossy());

    match {
        ZipService::unzip(&zipfile_path)?;
        copy_dir_all(unzipped_folder.join(&plugin_file_name), &plugin_path)?;
        Ok(())
    } {
        Ok(_) => {
            fs::remove_file(&zipfile_path)?;
            fs::remove_dir_all(unzipped_folder)?;
            return Ok(());
        }
        Err(e) => {
            fs::remove_file(&zipfile_path)?;
            fs::remove_dir_all(unzipped_folder)?;
            fs::remove_dir_all(&plugin_path)?;
            return Err(e);
        }
    }
}

async fn delete_plugin(
    plugin_name: &str,
    plugin_format: &str,
) -> Result<(), PluginControllerError> {
    let plugin_folder = get_plugin_folder(plugin_format)?;
    let plugin_file_name = get_plugin_file_name(plugin_name, plugin_format)?;
    let plugin_path = plugin_folder.join(&plugin_file_name);
    fs::remove_dir_all(&plugin_path)?;

    Ok(())
}

async fn download_zip_file(plugin_name: &str) -> Result<PathBuf, PluginControllerError> {
    let download_file_name = get_download_file_name(plugin_name)?;
    let url = format!(
        "https://github.com/davemollen/{0}/releases/latest/download/{1}",
        plugin_name, download_file_name
    );
    let response = reqwest::get(url).await?;
    let zipfile_content = response.bytes().await?;
    let zipfile_path = std::env::temp_dir().join(&download_file_name);
    let mut zipfile = File::create(&zipfile_path)?;

    match {
        io::copy(&mut zipfile_content.as_ref(), &mut zipfile)?;
        Ok(())
    } {
        Ok(()) => Ok(zipfile_path),
        Err(e) => {
            fs::remove_file(&zipfile_path)?;
            Err(e)
        }
    }
}

fn get_download_file_name(plugin_name: &str) -> Result<String, PluginControllerError> {
    let os = match get_os_type().as_str() {
        "macOS" => Ok("macos".to_string()),
        "windows" => Ok("windows".to_string()),
        "linux" => Ok("ubuntu".to_string()),
        _ => Err(PluginControllerError::UnknownOS),
    }?;

    Ok(format!("{0}-vst-and-clap-{1}.zip", plugin_name, os))
}

fn get_plugin_file_name(
    plugin_name: &str,
    plugin_format: &str,
) -> Result<String, PluginControllerError> {
    match plugin_format {
        "VST3" => Ok(format!("{}.vst3", plugin_name)),
        "CLAP" => Ok(format!("{}.clap", plugin_name)),
        "MOD Audio" => Ok(format!("{}.lv2", plugin_name)),
        _ => Err(PluginControllerError::Other(
            "Plugin format not found.".to_string(),
        )),
    }
}

fn get_plugin_folder(plugin_format: &str) -> Result<PathBuf, PluginControllerError> {
    let root_folder = std::env::var("HOME")?;
    let plugin_folder = match (plugin_format, get_os_type().as_str()) {
        ("VST3", "macOS") => Ok(format!("{}/Library/Audio/Plug-Ins/VST3", root_folder)),
        ("CLAP", "macOS") => Ok(format!("{}/Library/Audio/Plug-Ins/CLAP", root_folder)),
        ("VST3", "windows") => Ok("C:/Program Files/Common Files/VST3/".to_string()),
        ("CLAP", "windows") => Ok("C:/Program Files/Common Files/CLAP/".to_string()),
        ("VST3", "linux") => Ok(format!("{}/.vst3", root_folder)),
        ("CLAP", "linux") => Ok(format!("{}/.clap", root_folder)),
        _ => Err(PluginControllerError::PluginFolderNotFound),
    }?;

    Ok(PathBuf::from(plugin_folder))
}

fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> Result<(), PluginControllerError> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}

fn get_os_type() -> String {
    platform::Target::current().to_string()
}
