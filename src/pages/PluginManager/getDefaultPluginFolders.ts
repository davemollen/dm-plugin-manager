import { type } from '@tauri-apps/plugin-os';

export function getDefaultPluginFolders() {
    const osType = type();

    switch (osType) {
        case "macos":
            return {
                defaultVst3Folder: "/Library/Audio/Plug-Ins/VST3",
                defaultClapFolder: "/Library/Audio/Plug-Ins/CLAP"
            };
        case "linux":
            return {
                defaultVst3Folder: "~/.vst3",
                defaultClapFolder: "~/.clap"
            }
        case "windows":
            return {
                defaultVst3Folder: "C:/Program Files/Common Files/VST3",
                defaultClapFolder: "C:/Program Files/Common Files/CLAP"
            }
        default:
            return {
                defaultVst3Folder: "Default folder",
                defaultClapFolder: "Default folder"
            }
    }
}