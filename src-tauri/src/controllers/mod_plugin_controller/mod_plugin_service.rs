use std::path::{Path, PathBuf};

pub fn convert_to_path_object(path: String) -> PathBuf {
    Path::new(if path.starts_with("/") {
        &path[1..]
    } else {
        &path
    })
    .to_path_buf()
}

pub fn derive_destination_folder_path(destination_path: &Path) -> String {
    destination_path
        .ancestors()
        .nth(1)
        .unwrap()
        .to_str()
        .unwrap()
        .to_string()
}

pub fn extract_root_folder_name(path: &Path) -> String {
    let mut ancestors = path.ancestors();
    let root = ancestors.nth(ancestors.count() - 2).unwrap();
    root.file_name().unwrap().to_str().unwrap().to_string()
}
