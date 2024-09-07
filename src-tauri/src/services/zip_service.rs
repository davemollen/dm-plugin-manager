use crate::mod_plugin_controller::ArrayBufferWithPath;
use std::fs::{self, File};
use std::io::{self, Read};
use std::path::PathBuf;
use tar::Archive;

pub struct ZipService;

impl ZipService {
    pub fn unzip(file_path: &PathBuf) -> Result<(), io::Error> {
        let file = File::open(file_path)?;
        let mut archive = Archive::new(file);

        for entry in archive.entries()? {
            let mut entry = entry?;
            let path = entry.path()?;
            let out_path = file_path.parent().unwrap().join(PathBuf::from(path));

            // If the entry is a directory, create it
            if entry.header().entry_type().is_dir() {
                fs::create_dir_all(&out_path)?;
            } else {
                // Create parent directories if they don't exist
                if let Some(p) = out_path.parent() {
                    if !p.exists() {
                        fs::create_dir_all(&p)?;
                    }
                }

                // Extract the file
                entry.unpack(&out_path)?;
            }
        }

        Ok(())
    }

    pub fn unzip_to_u8(
        file_path: &PathBuf,
        starts_with: &PathBuf,
    ) -> Result<Vec<ArrayBufferWithPath>, io::Error> {
        let mut result: Vec<ArrayBufferWithPath> = Vec::new();
        let file = File::open(file_path)?;
        let mut archive = Archive::new(file);

        for entry in archive.entries()? {
            let mut entry = entry?;
            let path = entry.path()?;
            if !path.starts_with(starts_with) {
                continue;
            };

            let stripped_path = path.strip_prefix(starts_with.parent().unwrap()).unwrap();
            let path = stripped_path.to_string_lossy().to_string();

            if entry.header().entry_type().is_file() {
                let mut buffer = Vec::new();
                entry.read_to_end(&mut buffer)?;

                result.push(ArrayBufferWithPath { path, buffer })
            }
        }

        Ok(result)
    }
}
