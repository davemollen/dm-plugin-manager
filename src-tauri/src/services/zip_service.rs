use std::fs::{self, File};
use std::io;
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
}
