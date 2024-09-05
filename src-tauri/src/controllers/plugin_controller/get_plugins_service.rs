use super::{
    plugin_format::PluginFormat,
    utils::{get_plugin_bundle_name, get_plugin_folder, get_plugin_path},
    Error,
};
use crate::mod_plugin_controller::{self, SshError};
use serde_json::{json, Map, Value};
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
};

pub fn get_installed_vst_or_clap_plugins(
    plugin_formats: &Vec<String>,
    target_plugin_format: PluginFormat,
    folder: Option<String>,
    installable_plugins: &HashMap<String, Value>,
    installed_plugins: &mut HashMap<String, Value>,
) -> Result<(), Error> {
    let plugin_format_key = target_plugin_format.to_string();
    if !plugin_formats.contains(&plugin_format_key) {
        return Ok(());
    }
    let installables = match installable_plugins.get(&plugin_format_key) {
        Some(value) => value,
        None => return Ok(()),
    };
    let plugins = match installables {
        Value::Array(plugins) if !plugins.is_empty() => plugins,
        _ => return Ok(()),
    };
    let plugin_folder = match folder {
        Some(folder) => PathBuf::from(folder),
        None => get_plugin_folder(&target_plugin_format)?,
    };

    let found_plugins: Vec<Value> = plugins
        .iter()
        .filter_map(|plugin| {
            plugin.as_str().and_then(|plugin_name| {
                plugin_exists(&plugin_folder, plugin_name, &target_plugin_format)
                    .ok()
                    .filter(|&exists| exists)
                    .map(|_| plugin.to_owned())
            })
        })
        .collect();

    installed_plugins.insert(plugin_format_key, Value::Array(found_plugins));

    Ok(())
}

pub async fn get_installed_mod_plugins(
    plugin_formats: &Vec<String>,
    installable_plugins: &HashMap<String, Value>,
    installed_plugins: &mut HashMap<String, Value>,
) -> Result<(), Error> {
    let plugin_format_key = PluginFormat::ModAudio.to_string();
    if !plugin_formats.contains(&plugin_format_key) {
        return Ok(());
    }
    let mod_value = match installable_plugins.get(&plugin_format_key) {
        Some(value) => value,
        None => return Ok(()),
    };
    let mod_map = match mod_value {
        Value::Object(map) => map,
        _ => return Ok(()),
    };
    installed_plugins.insert(plugin_format_key.clone(), Value::Object(Map::new()));

    for (platform, value) in mod_map {
        let plugins = match value {
            Value::Array(plugins) if !plugins.is_empty() => plugins,
            _ => continue,
        };

        let result = mod_plugin_controller::get_mod_plugins().await;
        let all_plugins = match result {
            Err(mod_plugin_controller::Error::Ssh(SshError::NoConnection)) => {
                installed_plugins.insert("modIsConnected".to_string(), json!(false));
                return Ok(());
            }
            _ => {
                installed_plugins.insert("modIsConnected".to_string(), json!(true));
                result
            }
        }?;

        let found_plugins: Vec<Value> = plugins
            .iter()
            .filter_map(|plugin| {
                plugin.as_str().and_then(|plugin_name| {
                    get_plugin_bundle_name(plugin_name, &PluginFormat::ModAudio)
                        .ok()
                        .filter(|bundle_name| all_plugins.contains(bundle_name))
                        .map(|_| plugin.to_owned())
                })
            })
            .collect();

        let mut installable_mod_map = Map::new();
        installable_mod_map.insert(platform.to_string(), Value::Array(found_plugins));
        installed_plugins.insert(
            plugin_format_key.clone(),
            Value::Object(installable_mod_map),
        );
    }

    Ok(())
}

fn plugin_exists(
    plugin_folder: &PathBuf,
    plugin_name: &str,
    plugin_format: &PluginFormat,
) -> Result<bool, Error> {
    let plugin_path = get_plugin_path(plugin_folder, plugin_name, plugin_format)?;
    let exists = Path::exists(&plugin_path);

    Ok(exists)
}
