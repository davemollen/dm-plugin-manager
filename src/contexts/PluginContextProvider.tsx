import { usePersistedState } from "@/hooks/usePersistedState";
import { Mode, PluginFolders, PluginFormat } from "@/models/plugins";
import { createContext, ReactNode, useState } from "react";

export const PluginContext = createContext<{
  mode: Mode;
  selectedPluginFormats: PluginFormat[];
  pluginFolders: PluginFolders;
  setMode: (mode: Mode) => void;
  setSelectedPluginFormats: (selectedPluginFormats: PluginFormat[]) => void;
  onPluginFolderChange: (name: string, value: string) => void;
}>({
  mode: "Install",
  selectedPluginFormats: ["VST3", "CLAP", "MOD Audio"],
  pluginFolders: {},
  setMode: () => {},
  setSelectedPluginFormats: () => {},
  onPluginFolderChange: () => {},
});

export function PluginContextProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("Install");
  const [selectedPluginFormats, setSelectedPluginFormats] = useState<
    PluginFormat[]
  >(["VST3", "CLAP", "MOD Audio"]);
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
        pluginFolders,
        setMode,
        setSelectedPluginFormats,
        onPluginFolderChange,
      }}
    >
      {children}
    </PluginContext.Provider>
  );
}
