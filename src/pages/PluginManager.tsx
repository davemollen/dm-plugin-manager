import { Button } from "@/components/Button";
import { Checkbox, CheckboxSkeleton } from "@/components/Checkbox";
import { CheckboxList, CheckboxListSkeleton } from "@/components/CheckboxList";
import {
  RadioButtonList,
  RadioButtonListSkeleton,
} from "@/components/RadioButtonList";
import { useToast } from "@/hooks/useToast";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { DisconnectedMod } from "./PluginManager/DisconnectedMod";
import { error } from "@tauri-apps/plugin-log";
import { FolderInput } from "@/pages/PluginManager/FolderInput";
import { getDefaultPluginFolders } from "./PluginManager/getDefaultPluginFolders";

type Mode = "Install" | "Uninstall";
type PluginFormat = "VST3" | "CLAP" | "MOD Audio";
type ModPlatform = "Duo" | "Duo X" | "Dwarf";
type Plugins = {
  [K in PluginFormat]: K extends "MOD Audio"
    ? Record<ModPlatform, string[]>
    : string[];
} & {
  modIsConnected?: boolean;
};

const modes: Mode[] = ["Install", "Uninstall"];
const initialPlugins: Plugins = {
  VST3: [],
  CLAP: [],
  "MOD Audio": {
    Duo: [],
    "Duo X": [],
    Dwarf: [],
  },
  modIsConnected: undefined,
};

export function PluginManager() {
  const [mode, setMode] = useState<Mode>("Install");
  const [plugins, setPlugins] = useState<Plugins>(initialPlugins);
  const [selectedPlugins, setSelectedPlugins] =
    useState<Plugins>(initialPlugins);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedModPlatform, setSelectedModPlatform] =
    useState<ModPlatform>("Dwarf");
  const [pluginFolders, setPluginFolders] = useState<{
    vst3Folder?: string;
    clapFolder?: string;
  }>({});
  const toast = useToast();

  const hasModPlugins = Object.values(plugins["MOD Audio"]).some(
    (x) => x.length > 0,
  );
  const noPluginsSelected =
    !selectedPlugins["VST3"].length &&
    !selectedPlugins["CLAP"].length &&
    !selectedPlugins["MOD Audio"][selectedModPlatform].length;
  const { defaultVst3Folder, defaultClapFolder } = getDefaultPluginFolders();

  async function fetchPlugins() {
    try {
      setIsFetching(true);

      const plugins =
        mode === "Install"
          ? await invoke<Plugins>("get_installable_plugins")
          : await invoke<Plugins>("get_installed_plugins", pluginFolders);
      setPlugins(plugins);
      setSelectedPlugins({
        ...plugins,
        "MOD Audio": plugins.modIsConnected
          ? selectModAudioPlugins(plugins, selectedModPlatform)
          : initialPlugins["MOD Audio"],
      });
    } catch (e) {
      setPlugins(initialPlugins);
      error(e as string);
      toast?.error(e as string);
    } finally {
      setIsFetching(false);
    }
  }

  async function createPlugins() {
    try {
      setIsProcessing(true);
      await invoke<Plugins>("create_plugins", {
        plugins: selectedPlugins,
        ...pluginFolders,
      });
      toast?.success("Finished installing plugins");
    } catch (e) {
      toast?.error(e as string);
    } finally {
      setIsProcessing(false);
    }
  }

  async function deletePlugins() {
    try {
      await invoke<Plugins>("delete_plugins", {
        plugins: selectedPlugins,
        ...pluginFolders,
      });
      removePlugins();
      toast?.success("Finished uninstalling plugins");
    } catch (e) {
      toast?.error(e as string);
    }
  }

  function removePlugins() {
    const filteredPlugins: Plugins = {
      VST3: plugins["VST3"].filter(
        (plugin) => !selectedPlugins["VST3"].includes(plugin),
      ),
      CLAP: plugins["CLAP"].filter(
        (plugin) => !selectedPlugins["CLAP"].includes(plugin),
      ),
      "MOD Audio": {
        ...selectedPlugins["MOD Audio"],
        [selectedModPlatform]:
          plugins["MOD Audio"]?.[selectedModPlatform]?.filter(
            (plugin) =>
              !selectedPlugins["MOD Audio"]?.[selectedModPlatform]?.includes(
                plugin,
              ),
          ) ?? [],
      },
      modIsConnected: plugins.modIsConnected,
    };
    setPlugins(filteredPlugins);
    setSelectedPlugins(filteredPlugins);
  }

  function selectModAudioPlugins(plugins: Plugins, modPlatform: ModPlatform) {
    return Object.entries(plugins["MOD Audio"]).reduce<Plugins["MOD Audio"]>(
      (result, [key, value]) => {
        if (key === modPlatform) {
          result[key] = value;
        } else {
          result[key as ModPlatform] = [];
        }

        return result;
      },
      initialPlugins["MOD Audio"],
    );
  }

  async function onPluginFolderChange(name: string, value: string) {
    setPluginFolders({ ...pluginFolders, [name]: value });
    if (mode === "Uninstall") {
      await fetchPlugins();
    }
  }

  useEffect(() => {
    fetchPlugins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (isFetching) {
    return (
      <div className="w-full">
        <h4 className="font-sans text-xl font-bold">Mode</h4>
        <RadioButtonListSkeleton
          count={2}
          kind="bordered"
          className="mt-2 w-32"
        />

        <h4 className="mt-8 font-sans text-xl font-bold">Plugin formats</h4>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
          <CheckboxListSkeleton
            count={3}
            kind="bordered"
            className="w-full max-w-sm"
          />
          <CheckboxListSkeleton
            count={4}
            kind="bordered"
            className="w-full max-w-sm"
          />
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-panel">
            <CheckboxSkeleton className="bg-panel p-2" />
            <RadioButtonListSkeleton
              count={3}
              kind="bordered"
              className="!rounded-none !border-l-0 !border-r-0"
              radioButtonClassName="pl-4"
            />
            <CheckboxListSkeleton
              count={4}
              kind="bordered"
              enableCheckAll={false}
              className="!rounded-none !border-none"
            />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full">
      <h4 className="font-sans text-xl font-bold">Mode</h4>
      <RadioButtonList
        groupName="Mode"
        items={modes}
        selectedItem={mode}
        disabled={isProcessing}
        onChange={(item) => setMode(item)}
        className="mt-2 w-36"
        kind="bordered"
      />

      <h4 className="mt-8 font-sans text-xl font-bold">Plugin formats</h4>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        <CheckboxList
          title="VST3"
          items={plugins.VST3}
          selectedItems={selectedPlugins.VST3}
          disabled={isProcessing || !plugins.VST3.length}
          onChange={(items) => {
            setSelectedPlugins({ ...selectedPlugins, VST3: items });
          }}
          kind="bordered"
          className="max-w-sm"
          overrideCheckAllComponent={(props) => (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-panel p-2">
              <Checkbox {...props} id="VST3" name="VST3" value="VST3" />
              <FolderInput
                id="VST3-folder"
                label="Location: "
                name="vst3Folder"
                value={pluginFolders.vst3Folder ?? defaultVst3Folder}
                onChange={onPluginFolderChange}
              />
            </div>
          )}
          emptyComponent={
            <p className="py-4 pl-6 pr-2 text-sm">
              {mode === "Install"
                ? "No plugins to install."
                : "No plugins installed. Change the folder location if you have stored your plugins in a different place."}
            </p>
          }
        />

        <CheckboxList
          title="CLAP"
          items={plugins.CLAP}
          selectedItems={selectedPlugins.CLAP}
          disabled={isProcessing || !plugins.CLAP.length}
          onChange={(items) => {
            setSelectedPlugins({ ...selectedPlugins, CLAP: items });
          }}
          kind="bordered"
          className="max-w-sm"
          overrideCheckAllComponent={(props) => (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-panel p-2">
              <Checkbox {...props} id="CLAP" name="CLAP" value="CLAP" />
              <FolderInput
                id="CLAP-folder"
                label="Location: "
                name="clapFolder"
                value={pluginFolders.clapFolder ?? defaultClapFolder}
                onChange={onPluginFolderChange}
              />
            </div>
          )}
          emptyComponent={
            <p className="py-4 pl-6 pr-2 text-sm">
              {mode === "Install"
                ? "No plugins to install."
                : "No plugins installed. Change the folder location if you have stored your plugins in a different place."}
            </p>
          }
        />

        <CheckboxList
          title={selectedModPlatform}
          items={
            plugins.modIsConnected
              ? (plugins["MOD Audio"][selectedModPlatform] ?? [])
              : []
          }
          selectedItems={
            selectedPlugins["MOD Audio"][selectedModPlatform] ?? []
          }
          disabled={isProcessing || !plugins.modIsConnected || !hasModPlugins}
          onChange={(items) => {
            setSelectedPlugins({
              ...selectedPlugins,
              "MOD Audio": {
                ...selectedPlugins["MOD Audio"],
                [selectedModPlatform]: items,
              },
            });
          }}
          kind="bordered"
          className="max-w-sm"
          checkboxClassName={mode === "Install" ? "!pl-10" : "!pl-6"}
          overrideCheckAllComponent={(props) => (
            <div>
              <Checkbox
                {...props}
                id="MOD Audio"
                name="MOD Audio"
                value="MOD Audio"
                className="bg-panel p-2"
              />
              {mode === "Install" && props.items.length > 0 && (
                <RadioButtonList
                  groupName="MOD Audio"
                  items={Object.keys(plugins["MOD Audio"]) as ModPlatform[]}
                  selectedItem={selectedModPlatform}
                  disabled={props.disabled}
                  onChange={(item) => {
                    setSelectedModPlatform(item);
                    setSelectedPlugins({
                      ...selectedPlugins,
                      ["MOD Audio"]: selectModAudioPlugins(plugins, item),
                    });
                  }}
                  kind="bordered"
                  className="!rounded-none !border-l-0 !border-r-0"
                  radioButtonClassName="pl-4"
                />
              )}
            </div>
          )}
          emptyComponent={
            <>
              {plugins.modIsConnected === false ? (
                <DisconnectedMod
                  reconnect={fetchPlugins}
                  disabled={isProcessing}
                  className="py-4 pl-6 pr-2 text-sm"
                />
              ) : (
                <p className="py-2 pl-6 pr-2 text-sm">No plugins found.</p>
              )}
            </>
          }
        />
      </div>

      {!noPluginsSelected && (
        <div className="sticky bottom-4 mt-8 inline-block rounded-lg bg-background">
          <Button
            onClick={mode === "Install" ? createPlugins : deletePlugins}
            disabled={isProcessing}
            isLoading={isProcessing}
            className=""
          >
            {mode} plugins
          </Button>
        </div>
      )}
    </div>
  );
}
