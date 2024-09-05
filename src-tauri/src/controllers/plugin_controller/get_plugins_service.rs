use super::{plugin_format::PluginFormat, utils::get_plugin_path, Error};
use std::path::{Path, PathBuf};

pub fn plugin_exists(
    plugin_folder: &PathBuf,
    plugin_name: &str,
    plugin_format: &PluginFormat,
) -> Result<bool, Error> {
    let plugin_path = get_plugin_path(plugin_folder, plugin_name, plugin_format)?;
    let exists = Path::exists(&plugin_path);

    Ok(exists)
}
