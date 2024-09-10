use super::{
    plugin_format::PluginFormat,
    plugins::GetPluginsResponse,
    utils::{get_plugin_bundle_name, get_plugin_folder, get_plugin_path},
    Error,
};
use crate::mod_plugin_controller::{self, SshError};
use std::path::{Path, PathBuf};

pub fn get_installed_vst_or_clap_plugins(
    plugin_formats: &Vec<String>,
    target_plugin_format: PluginFormat,
    folder: Option<String>,
    installable_plugins: &GetPluginsResponse,
    installed_plugins: &mut GetPluginsResponse,
) -> Result<(), Error> {
    let plugin_format_key = target_plugin_format.to_string();
    if !plugin_formats.contains(&plugin_format_key) {
        return Ok(());
    }
    let plugins = match target_plugin_format {
        PluginFormat::VST3 => &installable_plugins.vst3,
        PluginFormat::CLAP => &installable_plugins.clap,
        _ => return Ok(()),
    };
    if plugins.is_empty() {
        return Ok(());
    }

    let plugin_folder = match folder {
        Some(folder) => PathBuf::from(folder),
        None => get_plugin_folder(&target_plugin_format)?,
    };

    let found_plugins: Vec<String> = plugins
        .iter()
        .filter_map(|plugin| {
            let plugin_name = plugin.as_str();

            plugin_exists(&plugin_folder, plugin_name, &target_plugin_format)
                .ok()
                .filter(|&exists| exists)
                .map(|_| plugin.to_owned())
        })
        .collect();

    match target_plugin_format {
        PluginFormat::VST3 => installed_plugins.vst3 = found_plugins,
        PluginFormat::CLAP => installed_plugins.clap = found_plugins,
        _ => return Ok(()),
    };

    Ok(())
}

pub async fn get_installed_mod_plugins(
    plugin_formats: &Vec<String>,
    installable_plugins: &GetPluginsResponse,
    installed_plugins: &mut GetPluginsResponse,
) -> Result<(), Error> {
    let plugin_format_key = PluginFormat::ModAudio.to_string();
    if !plugin_formats.contains(&plugin_format_key) {
        return Ok(());
    }
    let plugins = &installable_plugins.mod_audio;
    if plugins.is_empty() {
        return Ok(());
    }

    let result = mod_plugin_controller::get_mod_plugins().await;
    let all_plugins = match result {
        Err(mod_plugin_controller::Error::Ssh(SshError::NoConnection)) => {
            installed_plugins.mod_is_connected = false;
            return Ok(());
        }
        _ => {
            installed_plugins.mod_is_connected = true;
            result
        }
    }?;

    installed_plugins.mod_audio = plugins
        .iter()
        .filter_map(|plugin| {
            let plugin_name = plugin.as_str();

            get_plugin_bundle_name(plugin_name, &PluginFormat::ModAudio)
                .ok()
                .filter(|bundle_name| all_plugins.contains(bundle_name))
                .map(|_| plugin.to_owned())
        })
        .collect();

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
