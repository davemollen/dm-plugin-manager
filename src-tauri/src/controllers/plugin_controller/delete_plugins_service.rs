use super::{
    plugin_format::PluginFormat,
    utils::{get_plugin_folder, get_plugin_path},
    Error,
};
use crate::{mod_plugin_controller, plugin_controller::utils::get_plugin_bundle_name};
use futures::future::try_join_all;
use std::{fs, path::PathBuf};

pub async fn delete_vst_or_clap_plugins(
    plugins: Vec<String>,
    target_plugin_format: PluginFormat,
    folder: Option<String>,
) -> Result<(), Error> {
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
                delete_plugin(&plugin_folder, plugin.as_str(), &PluginFormat::VST3).await?;
                Ok::<(), Error>(())
            }
        })
        .collect();

    try_join_all(futures).await?;

    Ok(())
}

pub async fn delete_mod_plugins(plugins: Vec<String>) -> Result<(), Error> {
    if plugins.is_empty() {
        return Ok(());
    }

    let futures: Vec<_> = plugins
        .iter()
        .map(|plugin| async move {
            let bundle_name = get_plugin_bundle_name(plugin.as_str(), &PluginFormat::ModAudio)?;
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
