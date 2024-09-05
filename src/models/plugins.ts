export type Mode = "Install" | "Uninstall";
export type PluginFormat = "VST3" | "CLAP" | "MOD Audio";
export type ModPlatform = "Duo" | "Duo X" | "Dwarf";
export type PluginFolders = {
  vst3Folder?: string;
  clapFolder?: string;
};

type Plugins = {
  [K in PluginFormat]: K extends "MOD Audio"
    ? Record<ModPlatform, string[]> | undefined
    : string[] | undefined;
};

export type FetchPluginsResponse = Plugins & {
    modIsConnected?: boolean;
}

export type SelectedPlugins = Record<PluginFormat, string[] | undefined>