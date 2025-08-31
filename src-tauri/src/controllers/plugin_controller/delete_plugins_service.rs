use super::{
    plugin_format::PluginFormat,
    utils::{get_plugin_folder, get_plugin_path},
    Error,
};
use crate::{
    mod_plugin_controller,
    plugin_controller::utils::{delete_files_on_mac_os_as_admin, get_plugin_bundle_name},
};
use futures::future::try_join_all;
use std::{fs, path::PathBuf};
use tauri::utils::platform::Target;

pub async fn delete_desktop_plugins(
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
            let plugin_format = target_plugin_format.clone();

            async move {
                delete_plugin(&plugin_folder, plugin.as_str(), &plugin_format).await?;
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
    if Target::current() == Target::MacOS {
        delete_files_on_mac_os_as_admin(&plugin_path.to_string_lossy())
    } else {
        fs::remove_dir_all(&plugin_path)?;
        Ok(())
    }
}
