use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub enum ModPlatform {
    Duo,
    DuoX,
    Dwarf,
}
