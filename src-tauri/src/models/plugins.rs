use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default)]
pub struct ModPlugins {
    #[serde(rename = "Duo")]
    pub duo: Vec<String>,
    #[serde(rename = "DuoX")]
    pub duo_x: Vec<String>,
    #[serde(rename = "Dwarf")]
    pub dwarf: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct PluginsConfig {
    #[serde(rename = "VST3")]
    pub vst3: Vec<String>,
    #[serde(rename = "CLAP")]
    pub clap: Vec<String>,
    #[serde(rename = "MOD Audio")]
    pub mod_audio: ModPlugins,
}

#[derive(Serialize, Deserialize, Default)]
pub struct GetPluginsResponse {
    #[serde(rename = "VST3")]
    pub vst3: Vec<String>,
    #[serde(rename = "CLAP")]
    pub clap: Vec<String>,
    #[serde(rename = "MOD Audio")]
    pub mod_audio: ModPlugins,
    #[serde(rename = "modIsConnected")]
    pub mod_is_connected: bool,
}

#[derive(Serialize, Deserialize, Default)]
pub struct SelectedPlugins {
    #[serde(rename = "VST3")]
    pub vst3: Vec<String>,
    #[serde(rename = "CLAP")]
    pub clap: Vec<String>,
    #[serde(rename = "MOD Audio")]
    pub mod_audio: Vec<String>,
}
