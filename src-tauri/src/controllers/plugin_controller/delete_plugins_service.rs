use super::{plugin_format::PluginFormat, utils::get_plugin_path, Error};
use std::{fs, path::PathBuf};

pub async fn delete_plugin(
    plugin_folder: &PathBuf,
    plugin_name: &str,
    plugin_format: &PluginFormat,
) -> Result<(), Error> {
    let plugin_path = get_plugin_path(plugin_folder, plugin_name, plugin_format)?;
    fs::remove_dir_all(&plugin_path)?;

    Ok(())
}
