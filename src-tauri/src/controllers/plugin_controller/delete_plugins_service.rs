use super::{
    plugin_format::PluginFormat,
    utils::{get_plugin_folder, get_plugin_path},
    Error,
};
use crate::{mod_plugin_controller, plugin_controller::utils::get_plugin_bundle_name};
use futures::future::try_join_all;
use serde_json::Value;
use std::{collections::HashMap, fs, path::PathBuf};

pub async fn delete_vst_or_clap_plugins(
    plugins: &HashMap<String, serde_json::Value>,
    target_plugin_format: PluginFormat,
    folder: Option<String>,
) -> Result<(), Error> {
    let plugin_format_key = target_plugin_format.to_string();
    let plugins = match plugins.get(&plugin_format_key) {
        Some(value) => value,
        None => return Ok(()),
    };
    let plugins = match plugins {
        Value::Array(plugins) => plugins,
        _ => return Ok(()),
    };
    if plugins.is_empty() {
        return Ok(());
    }

    let plugin_folder = if let Some(folder) = folder {
        PathBuf::from(folder)
    } else {
        get_plugin_folder(&target_plugin_format)?
    };

    let futures: Vec<_> = plugins
        .iter()
        .map(|plugin| {
            let plugin_folder = plugin_folder.clone();
            async move {
                let plugin_name = plugin.as_str().unwrap();
                delete_plugin(&plugin_folder, plugin_name, &PluginFormat::VST3).await?;
                Ok::<(), Error>(())
            }
        })
        .collect();

    try_join_all(futures).await?;

    Ok(())
}

pub async fn delete_mod_plugins(plugins: &HashMap<String, serde_json::Value>) -> Result<(), Error> {
    let plugin_format_key = PluginFormat::ModAudio.to_string();
    let plugins = match plugins.get(&plugin_format_key) {
        Some(value) => value,
        None => return Ok(()),
    };
    let plugins = match plugins {
        Value::Array(value) => value,
        _ => return Ok(()),
    };
    if plugins.is_empty() {
        return Ok(());
    }

    let futures: Vec<_> = plugins
        .iter()
        .map(|plugin| async move {
            let plugin_name = plugin.as_str().unwrap();
            let bundle_name = get_plugin_bundle_name(plugin_name, &PluginFormat::ModAudio)?;
            mod_plugin_controller::delete_mod_plugin(bundle_name).await?;
            Ok::<(), Error>(())
        })
        .collect();

    try_join_all(futures).await?;

    Ok(())
}

async fn delete_plugin(
    plugin_folder: &PathBuf,
    plugin_name: &str,
    plugin_format: &PluginFormat,
) -> Result<(), Error> {
    let plugin_path = get_plugin_path(plugin_folder, plugin_name, plugin_format)?;
    fs::remove_dir_all(&plugin_path)?;

    Ok(())
}
