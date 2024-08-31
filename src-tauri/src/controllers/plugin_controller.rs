#[path = "../services/zip_service.rs"]
mod zip_service;
use futures::future::try_join_all;
use serde_json::{json, Map, Value};
use std::{
    collections::HashMap,
    fs::{self, File},
    io,
    path::{Path, PathBuf},
    process::Command,
};
use tauri::utils::platform;
use thiserror::Error;
use zip_service::ZipService;

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
    ModPluginControllerError(#[from] mod_plugin_controller::Error),

    #[error("Could not find a plugin folder for this operating system and plugin format")]
    NoPluginFolder,

    #[error("Unknown operating system")]
    NoDownloadFile,

    #[error("Unknown plugin format")]
    NoPluginFormat,

    #[error("Failed to create directory: {0}")]
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
pub async fn get_installable_plugins() -> Result<HashMap<String, serde_json::Value>, Error> {
    // TODO make new api to checks what plugins are available
    let mut data: HashMap<String, serde_json::Value> = HashMap::new();

    let mut mod_audio: HashMap<String, Vec<String>> = HashMap::new();

    let result = mod_plugin_controller::establish_connection().await;
    match result {
        Err(mod_plugin_controller::Error::Ssh(SshError::NoConnection)) => {
            data.insert("modIsConnected".to_string(), json!(false));
            Ok(())
        }
        _ => result,
    }?;
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
pub async fn get_installed_plugins() -> Result<HashMap<String, serde_json::Value>, Error> {
    let mut installed_plugins: HashMap<String, serde_json::Value> = HashMap::new();
    let installable_plugins = get_installable_plugins().await?;

    if let Some(vst3_value) = installable_plugins.get("VST3") {
        if let Value::Array(plugins) = vst3_value {
            if !plugins.is_empty() {
                let found_plugins: Vec<Value> = plugins
                    .iter()
                    .filter(|plugin| {
                        if let Some(plugin_name) = plugin.as_str() {
                            plugin_exists(plugin_name, "VST3").unwrap_or(false)
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

    if let Some(clap_value) = installable_plugins.get("CLAP") {
        if let Value::Array(plugins) = clap_value {
            if !plugins.is_empty() {
                let found_plugins: Vec<Value> = plugins
                    .iter()
                    .filter(|plugin| {
                        if let Some(plugin_name) = plugin.as_str() {
                            plugin_exists(plugin_name, "CLAP").unwrap_or(false)
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

    if let Some(mod_value) = installable_plugins.get("MOD Audio") {
        if let Value::Object(mod_map) = mod_value {
            for (platform, value) in mod_map {
                if let Value::Array(plugins) = value {
                    installed_plugins.insert("MOD Audio".to_string(), Value::Object(Map::new()));

                    if !plugins.is_empty() {
                        let result = mod_plugin_controller::get_mod_plugins().await;
                        let all_plugins = match result {
                            Err(mod_plugin_controller::Error::Ssh(SshError::NoConnection)) => {
                                installed_plugins
                                    .insert("modIsConnected".to_string(), json!(false));
                                return Ok(installed_plugins);
                            }
                            Err(e) => Err(Error::ModPluginControllerError(e)),
                            Ok(plugins) => Ok(plugins),
                        }?;

                        let found_plugins = plugins
                            .iter()
                            .filter(|plugin| {
                                if let Some(plugin_name) = plugin.as_str() {
                                    all_plugins.contains(&plugin_name.to_string())
                                } else {
                                    false
                                }
                            })
                            .map(|item| item.to_owned())
                            .collect();

                        let mut installable_mod_map = Map::new();
                        installable_mod_map
                            .insert(platform.to_string(), Value::Array(found_plugins));
                        installed_plugins
                            .insert("MOD Audio".to_string(), Value::Object(installable_mod_map));
                    }
                }
            }
        }
    }

    Ok(installed_plugins)
}

#[tauri::command]
pub async fn create_plugins(plugins: HashMap<String, serde_json::Value>) -> Result<(), Error> {
    if let Some(vst3_value) = plugins.get("VST3") {
        if let Value::Array(plugins) = vst3_value {
            if !plugins.is_empty() {
                if get_os_type().as_str() == "macOS" {
                    create_plugin_folder("VST3")?;
                }

                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| async move {
                        let plugin_name = plugin.as_str().unwrap();
                        println!("Started installing VST3 plugin: {}", plugin_name);
                        create_plugin(plugin_name, "VST3").await?;
                        println!("Finished installing VST3 plugin: {}", plugin_name);

                        Ok::<(), Error>(())
                    })
                    .collect();

                try_join_all(futures).await?;
            }
        }
    }

    if let Some(clap_value) = plugins.get("CLAP") {
        if let Value::Array(plugins) = clap_value {
            if !plugins.is_empty() {
                if get_os_type().as_str() == "macOS" {
                    create_plugin_folder("CLAP")?;
                }

                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| async move {
                        let plugin_name = plugin.as_str().unwrap();
                        println!("Started installing CLAP plugin: {}", plugin_name);
                        create_plugin(plugin_name, "CLAP").await?;
                        println!("Finished installing CLAP plugin: {}", plugin_name);

                        Ok::<(), Error>(())
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
                        // TODO: check if we can do these SSH operation concurrently
                        let futures: Vec<_> = plugins
                            .iter()
                            .map(|plugin| async move {
                                let plugin_name = plugin.as_str().unwrap();
                                let mod_platform = platform.as_str();
                                println!(
                                    "Started installing MOD {} plugin: {}",
                                    platform, plugin_name
                                );
                                create_mod_plugin(plugin_name, Some(mod_platform)).await?;
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
pub async fn delete_plugins(plugins: HashMap<String, serde_json::Value>) -> Result<(), Error> {
    if let Some(mod_value) = plugins.get("MOD Audio") {
        if let Value::Object(mod_map) = mod_value {
            for (platform, value) in mod_map {
                if let Value::Array(plugins) = value {
                    if !plugins.is_empty() {
                        // TODO: check if we can do these SSH operations concurrently
                        let futures: Vec<_> = plugins
                            .iter()
                            .map(|plugin| async move {
                                let plugin_name = plugin.as_str().unwrap();
                                println!(
                                    "Started uninstalling MOD {} plugin: {}",
                                    platform, plugin_name
                                );
                                mod_plugin_controller::delete_mod_plugin(plugin_name.to_string())
                                    .await?;
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

    if let Some(vst3_value) = plugins.get("VST3") {
        if let Value::Array(plugins) = vst3_value {
            if !plugins.is_empty() {
                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| async move {
                        let plugin_name = plugin.as_str().unwrap();
                        println!("Started uninstalling VST3 plugin: {}", plugin_name);
                        delete_plugin(plugin_name, "VST3").await?;
                        println!("Finished uninstalling VST3 plugin: {}", plugin_name);

                        Ok::<(), Error>(())
                    })
                    .collect();

                try_join_all(futures).await?;
            }
        }
    }

    if let Some(clap_value) = plugins.get("CLAP") {
        if let Value::Array(plugins) = clap_value {
            if !plugins.is_empty() {
                let futures: Vec<_> = plugins
                    .iter()
                    .map(|plugin| async move {
                        let plugin_name = plugin.as_str().unwrap();
                        println!("Started uninstalling CLAP plugin: {}", plugin_name);
                        delete_plugin(plugin_name, "CLAP").await?;
                        println!("Finished uninstalling CLAP plugin: {}", plugin_name);

                        Ok::<(), Error>(())
                    })
                    .collect();

                try_join_all(futures).await?;
            }
        }
    }

    Ok(())
}

async fn create_mod_plugin(plugin_name: &str, mod_platform: Option<&str>) -> Result<(), Error> {
    let zipfile_path = download_zip_file(plugin_name, mod_platform).await?;

    match {
        let files = ZipService::unzip_to_u8(&zipfile_path)?;
        mod_plugin_controller::create_mod_plugins(files).await?;
        Ok(())
    } {
        Ok(_) => {
            fs::remove_file(&zipfile_path)?;
            return Ok(());
        }
        Err(e) => {
            fs::remove_file(&zipfile_path)?;
            return Err(e);
        }
    }
}

async fn create_plugin(plugin_name: &str, plugin_format: &str) -> Result<(), Error> {
    let plugin_file_name = get_plugin_file_name(plugin_name, plugin_format)?;
    let plugin_path = get_plugin_path(plugin_name, plugin_format)?;
    let zipfile_path = download_zip_file(plugin_name, None).await?;
    let unzipped_folder = zipfile_path.with_extension("");
    println!(
        "Unzipped folder path: {}",
        unzipped_folder.to_string_lossy()
    );

    let unzip_result = ZipService::unzip(&zipfile_path).map_err(Error::from);
    let copy_result = unzip_result.and_then(|_| {
        copy_dir_all(unzipped_folder.join(&plugin_file_name), &plugin_path).map_err(Error::from)
    });
    match copy_result {
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

async fn delete_plugin(plugin_name: &str, plugin_format: &str) -> Result<(), Error> {
    let plugin_path = get_plugin_path(plugin_name, plugin_format)?;
    fs::remove_dir_all(&plugin_path)?;

    Ok(())
}

fn plugin_exists(plugin_name: &str, plugin_format: &str) -> Result<bool, Error> {
    let plugin_path = get_plugin_path(plugin_name, plugin_format)?;
    let exists = Path::exists(&plugin_path);

    Ok(exists)
}

async fn download_zip_file(
    plugin_name: &str,
    mod_platform: Option<&str>,
) -> Result<PathBuf, Error> {
    let download_file_name = get_download_file_name(plugin_name, mod_platform)?;
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

fn get_download_file_name(plugin_name: &str, mod_platform: Option<&str>) -> Result<String, Error> {
    let os = match (get_os_type().as_str(), mod_platform) {
        ("macOS", None) => Ok("macos".to_string()),
        ("windows", None) => Ok("windows".to_string()),
        ("linux", None) => Ok("ubuntu".to_string()),
        (_, Some(mod_platform)) => Ok(mod_platform.to_string()),
        _ => Err(Error::NoDownloadFile),
    }?;

    Ok(format!("{0}-vst-and-clap-{1}.zip", plugin_name, os))
}

fn get_plugin_path(plugin_name: &str, plugin_format: &str) -> Result<PathBuf, Error> {
    let plugin_folder = get_plugin_folder(plugin_format)?;
    let plugin_file_name = get_plugin_file_name(plugin_name, plugin_format)?;
    let plugin_path = plugin_folder.join(&plugin_file_name);

    Ok(plugin_path)
}

fn get_plugin_file_name(plugin_name: &str, plugin_format: &str) -> Result<String, Error> {
    match plugin_format {
        "VST3" => Ok(format!("{}.vst3", plugin_name)),
        "CLAP" => Ok(format!("{}.clap", plugin_name)),
        "MOD Audio" => Ok(format!("{}.lv2", plugin_name)),
        _ => Err(Error::NoPluginFormat),
    }
}

fn get_plugin_folder(plugin_format: &str) -> Result<PathBuf, Error> {
    let home_dir = dirs::home_dir();
    let plugin_folder = match (plugin_format, get_os_type().as_str(), home_dir) {
        ("VST3", "macOS", _) => Ok(PathBuf::from("/Library/Audio/Plug-Ins/VST3")),
        ("CLAP", "macOS", _) => Ok(PathBuf::from("/Library/Audio/Plug-Ins/CLAP")),
        ("VST3", "windows", _) => Ok(PathBuf::from("C:/Program Files/Common Files/VST3")),
        ("CLAP", "windows", _) => Ok(PathBuf::from("C:/Program Files/Common Files/CLAP")),
        ("VST3", "linux", Some(home)) => Ok(home.join(Path::new(".vst3"))),
        ("CLAP", "linux", Some(home)) => Ok(home.join(Path::new(".clap"))),
        _ => Err(Error::NoPluginFolder),
    }?;

    Ok(plugin_folder)
}

fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> Result<(), Error> {
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

fn create_plugin_folder(plugin_format: &str) -> Result<(), Error> {
    let folder_path = get_plugin_folder(plugin_format)?;

    if folder_path.exists() {
        return Ok(());
    }

    let username_cmd = Command::new("id").arg("-un").output()?;
    if username_cmd.status.success() {
        let username = String::from_utf8_lossy(&username_cmd.stdout).to_string();

        let create_dir_script = format!(
            r#"do shell script "install -d -m 0755 -o {} {}" with administrator privileges"#,
            username,
            folder_path.to_string_lossy()
        );
        let create_dir_cmd = Command::new("osascript")
            .arg("-e")
            .arg(create_dir_script)
            .output()?;
        if create_dir_cmd.status.success() {
            Ok(())
        } else {
            Err(Error::CreateDirectoryError(
                String::from_utf8_lossy(&create_dir_cmd.stderr).to_string(),
            ))
        }
    } else {
        Err(Error::CreateDirectoryError(
            String::from_utf8_lossy(&username_cmd.stderr).to_string(),
        ))
    }
}
