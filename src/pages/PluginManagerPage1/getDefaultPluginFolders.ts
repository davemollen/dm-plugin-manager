import { type } from "@tauri-apps/plugin-os";

export function getDefaultPluginFolders() {
  const osType = type();

  switch (osType) {
    case "macos":
      return {
        defaultVst3Folder: "/Library/Audio/Plug-Ins/VST3",
        defaultClapFolder: "/Library/Audio/Plug-Ins/CLAP",
        defaultLV2Folder: "/Library/Audio/Plug-Ins/LV2",
      };
    case "linux":
      return {
        defaultVst3Folder: "~/.vst3",
        defaultClapFolder: "~/.clap",
        defaultLV2Folder: "~/.lv2",
      };
    case "windows":
      return {
        defaultVst3Folder: "C:/Program Files/Common Files/VST3",
        defaultClapFolder: "C:/Program Files/Common Files/CLAP",
        defaultLV2Folder: "C:/Program Files/Common Files/LV2",
      };
    default:
      return {
        defaultVst3Folder: "Select a folder",
        defaultClapFolder: "Select a folder",
        defaultLV2Folder: "Select a folder",
      };
  }
}
