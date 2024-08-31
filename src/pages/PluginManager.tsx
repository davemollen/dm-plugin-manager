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
  const toast = useToast();

  const hasVst3Plugins = plugins["VST3"].length > 0;
  const hasClapPlugins = plugins["CLAP"].length > 0;
  const hasModPlugins = Object.values(plugins["MOD Audio"]).some(
    (x) => x.length > 0,
  );
  const noPluginsFound = !hasVst3Plugins && !hasClapPlugins && !hasModPlugins;
  const noPluginsSelected =
    !selectedPlugins["VST3"].length &&
    !selectedPlugins["CLAP"].length &&
    !selectedPlugins["MOD Audio"][selectedModPlatform].length;

  async function fetchPlugins() {
    try {
      setIsFetching(true);

      const plugins =
        mode === "Install"
          ? await invoke<Plugins>("get_installable_plugins")
          : await invoke<Plugins>("get_installed_plugins");
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
      });
      toast?.success("Finished uninstalling plugins");
    } catch (e) {
      toast?.error(e as string);
    }
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
        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          <CheckboxListSkeleton
            count={3}
            kind="bordered"
            className="max-w-xs"
          />
          <CheckboxListSkeleton
            count={4}
            kind="bordered"
            className="max-w-xs"
          />
          <div className="max-w-xs overflow-hidden rounded-xl border border-panel">
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

      {noPluginsFound ? (
        <div className="mt-8 rounded-xl bg-panel p-4">
          <h3 className="font-sans text-3xl font-bold">No plugins found</h3>
          <p className="mt-4">
            Unfortunately no plugins are available at this time. Please try
            again later.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <h4 className="font-sans text-xl font-bold">Plugin formats</h4>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
            {hasVst3Plugins && (
              <CheckboxList
                title="VST3"
                items={plugins?.VST3}
                selectedItems={selectedPlugins.VST3}
                disabled={isProcessing}
                onChange={(items) => {
                  setSelectedPlugins({ ...selectedPlugins, VST3: items });
                }}
                kind="bordered"
                className="max-w-xs"
              />
            )}
            {hasClapPlugins && (
              <CheckboxList
                title="CLAP"
                items={plugins?.CLAP}
                selectedItems={selectedPlugins.CLAP}
                disabled={isProcessing}
                onChange={(items) => {
                  setSelectedPlugins({ ...selectedPlugins, CLAP: items });
                }}
                kind="bordered"
                className="max-w-xs"
              />
            )}
            {plugins.modIsConnected && hasModPlugins && (
              <CheckboxList
                title={selectedModPlatform}
                items={plugins?.["MOD Audio"][selectedModPlatform]}
                selectedItems={
                  selectedPlugins["MOD Audio"][selectedModPlatform]
                }
                disabled={isProcessing}
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
                className="max-w-xs"
                checkboxClassName="!pl-10"
                overrideCheckAllComponent={(props) => (
                  <div>
                    <Checkbox
                      {...props}
                      id="MOD Audio"
                      name="MOD Audio"
                      value="MOD Audio"
                      className="bg-panel p-2"
                      disabled={
                        !selectedPlugins["MOD Audio"][selectedModPlatform]
                          .length
                      }
                    />
                    <RadioButtonList
                      groupName="MOD Audio"
                      items={Object.keys(plugins["MOD Audio"]) as ModPlatform[]}
                      selectedItem={selectedModPlatform}
                      disabled={isProcessing}
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
                  </div>
                )}
              />
            )}
            {plugins.modIsConnected === false && (
              <div className="flex max-w-md flex-col overflow-hidden rounded-xl border border-panel/50">
                <Checkbox
                  id="MOD Audio"
                  name="MOD Audio"
                  value="MOD Audio"
                  onChange={() => {}}
                  disabled={true}
                  className="bg-panel/50 p-2"
                />
                <DisconnectedMod
                  reconnect={fetchPlugins}
                  disabled={isProcessing}
                  className="py-4 pl-6 pr-2"
                />
              </div>
            )}
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
      )}
    </div>
  );
}
