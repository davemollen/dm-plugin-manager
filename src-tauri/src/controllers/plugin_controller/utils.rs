use super::{plugin_format::PluginFormat, Error};
use std::path::{Path, PathBuf};
use tauri::utils::platform::Target;

pub fn get_plugin_path(
    plugin_folder: &PathBuf,
    plugin_name: &str,
    plugin_format: &PluginFormat,
) -> Result<PathBuf, Error> {
    let bundle_name = get_plugin_bundle_name(plugin_name, plugin_format)?;
    let plugin_path = plugin_folder.join(&bundle_name);

    Ok(plugin_path)
}

pub fn get_plugin_bundle_name(
    plugin_name: &str,
    plugin_format: &PluginFormat,
) -> Result<String, Error> {
    match plugin_format {
        PluginFormat::VST3 => Ok(format!("{}.vst3", plugin_name)),
        PluginFormat::CLAP => Ok(format!("{}.clap", plugin_name)),
        PluginFormat::ModAudio => Ok(format!("{}.lv2", plugin_name)),
        _ => Err(Error::NoPluginFormat),
    }
}

pub fn get_plugin_folder(plugin_format: PluginFormat) -> Result<PathBuf, Error> {
    let home_dir = dirs::home_dir();
    let plugin_folder = match (plugin_format, Target::current(), home_dir) {
        (PluginFormat::VST3, Target::MacOS, _) => Ok(PathBuf::from("/Library/Audio/Plug-Ins/VST3")),
        (PluginFormat::CLAP, Target::MacOS, _) => Ok(PathBuf::from("/Library/Audio/Plug-Ins/CLAP")),
        (PluginFormat::VST3, Target::Windows, _) => {
            Ok(PathBuf::from("C:/Program Files/Common Files/VST3"))
        }
        (PluginFormat::CLAP, Target::Windows, _) => {
            Ok(PathBuf::from("C:/Program Files/Common Files/CLAP"))
        }
        (PluginFormat::VST3, Target::Linux, Some(home)) => Ok(home.join(Path::new(".vst3"))),
        (PluginFormat::CLAP, Target::Linux, Some(home)) => Ok(home.join(Path::new(".clap"))),
        _ => Err(Error::NoPluginFolder),
    }?;

    Ok(plugin_folder)
}
