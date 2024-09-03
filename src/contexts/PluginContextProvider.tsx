import { createContext, ReactNode, useState } from "react";

type Mode = "Install" | "Uninstall";
type PluginFormat = "VST3" | "CLAP" | "MOD Audio";
type PluginFolders = {
  vst3Folder?: string;
  clapFolder?: string;
};

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
  const [pluginFolders, setPluginFolders] = useState<PluginFolders>({});

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
