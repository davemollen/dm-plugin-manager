use crate::mod_plugin_controller::ArrayBufferWithPath;
use std::fs::{self, File};
use std::io::{self, Read};
use std::path::PathBuf;
use zip::ZipArchive;

pub struct ZipService;

impl ZipService {
    pub fn unzip(file_path: &PathBuf) -> Result<(), io::Error> {
        let file = File::open(file_path)?;
        let mut archive = ZipArchive::new(file)?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let path = match file.enclosed_name() {
                Some(path) => path,
                None => continue,
            };
            let folder = match file_path.parent() {
                Some(path) => path,
                None => continue,
            };
            let output_path = folder.join(PathBuf::from(path));

            // If the entry is a directory, create it
            if file.is_dir() {
                fs::create_dir_all(&output_path)?;
            } else {
                // Create parent directories if they don't exist
                if let Some(p) = output_path.parent() {
                    if !p.exists() {
                        fs::create_dir_all(&p)?;
                    }
                }

                // Extract the file
                let mut output_file = File::create(&output_path)?;
                io::copy(&mut file, &mut output_file)?;
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
        let mut archive = ZipArchive::new(file)?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let path = match file.enclosed_name() {
                Some(path) => path,
                None => continue,
            };
            if !path.starts_with(starts_with) {
                continue;
            };
            let starts_with_parent = match starts_with.parent() {
                Some(parent) => parent,
                None => continue,
            };
            let stripped_path = match path.strip_prefix(starts_with_parent) {
                Ok(p) => p,
                Err(_) => continue,
            };
            let path = stripped_path.to_string_lossy().to_string();

            if file.is_file() {
                let mut buffer = Vec::new();
                file.read_to_end(&mut buffer)?;
                result.push(ArrayBufferWithPath { path, buffer })
            }
        }

        Ok(result)
    }
}
