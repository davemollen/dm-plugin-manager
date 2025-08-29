import { usePersistedState } from "@/hooks/usePersistedState";
import {
  Mode,
  ModPlatform,
  PluginFolders,
  PluginFormat,
} from "@/models/plugins";
import { createContext, ReactNode, useState } from "react";
import { type } from "@tauri-apps/plugin-os";

export const PluginContext = createContext<{
  mode: Mode;
  selectedPluginFormats: PluginFormat[];
  selectedModPlatform: ModPlatform;
  pluginFolders: PluginFolders;
  setMode: (mode: Mode) => void;
  setSelectedPluginFormats: (selectedPluginFormats: PluginFormat[]) => void;
  setSelectedModPlatform: (selectedModPlatform: ModPlatform) => void;
  onPluginFolderChange: (name: string, value: string) => void;
}>({
  mode: "Install",
  selectedModPlatform: "Dwarf",
  selectedPluginFormats: ["VST3", "CLAP", "AUv2", "LV2"],
  pluginFolders: {},
  setMode: () => {},
  setSelectedPluginFormats: () => {},
  setSelectedModPlatform: () => {},
  onPluginFolderChange: () => {},
});

export function PluginContextProvider({ children }: { children: ReactNode }) {
  const osType = type();
  const [mode, setMode] = useState<Mode>("Install");
  const [selectedPluginFormats, setSelectedPluginFormats] = useState<
    PluginFormat[]
  >(
    (["VST3", "CLAP", "AUv2", "LV2"] as PluginFormat[]).filter(
      (pluginFormats) => (osType === "macos" ? true : pluginFormats != "AUv2"),
    ),
  );
  const [selectedModPlatform, setSelectedModPlatform] =
    useState<ModPlatform>("Dwarf");
  const [pluginFolders, setPluginFolders] = usePersistedState<PluginFolders>(
    "pluginFolders",
    {},
  );

  function onPluginFolderChange(name: string, value: string) {
    setPluginFolders({ ...pluginFolders, [name]: value });
  }

  return (
    <PluginContext.Provider
      value={{
        mode,
        selectedPluginFormats,
        selectedModPlatform,
        pluginFolders,
        setMode,
        setSelectedPluginFormats,
        setSelectedModPlatform,
        onPluginFolderChange,
      }}
    >
      {children}
    </PluginContext.Provider>
  );
}
