use std::fmt::{Display, Formatter, Result};

pub enum PluginFormat {
    VST3,
    CLAP,
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
                Self::ModAudio => "MOD Audio",
            }
        )
    }
}
