import { usePersistedState } from "@/hooks/usePersistedState";
import {
  Mode,
  ModPlatform,
  PluginFolders,
  PluginFormat,
} from "@/models/plugins";
import { createContext, ReactNode, useState } from "react";

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
  selectedPluginFormats: ["VST3", "CLAP", "MOD Audio"],
  pluginFolders: {},
  setMode: () => {},
  setSelectedPluginFormats: () => {},
  setSelectedModPlatform: () => {},
  onPluginFolderChange: () => {},
});

export function PluginContextProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("Install");
  const [selectedPluginFormats, setSelectedPluginFormats] = useState<
    PluginFormat[]
  >(["VST3", "CLAP", "MOD Audio"]);
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
