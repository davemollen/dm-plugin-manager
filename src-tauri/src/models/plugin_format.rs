use std::fmt::{Display, Formatter, Result};

#[derive(Clone)]
pub enum PluginFormat {
    VST3,
    CLAP,
    LV2,
    ModAudio,
}

impl Display for PluginFormat {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result {
        write!(
            f,
            "{}",
            match self {
                Self::VST3 => "VST3",
                Self::CLAP => "CLAP",
                Self::LV2 => "LV2",
                Self::ModAudio => "MOD Audio",
            }
        )
    }
}
