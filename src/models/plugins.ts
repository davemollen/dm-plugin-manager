export type Mode = "Install" | "Uninstall";
export type PluginFormat = "VST3" | "CLAP" | "LV2" | "MOD Audio";
export type ModPlatform = "Duo" | "DuoX" | "Dwarf";
export type PluginFolders = {
  vst3Folder?: string;
  clapFolder?: string;
  lv2Folder?: string;
};

export type FetchPluginsResponse = Record<PluginFormat, string[]> & {
  modIsConnected?: boolean;
};
export type SelectedPlugins = Record<PluginFormat, string[]>;
