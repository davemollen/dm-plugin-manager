import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { CheckboxList } from "@/components/CheckboxList";
import { RadioButtonList } from "@/components/RadioButtonList";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { useEffect, useState } from "react";

type Mode = "Install" | "Uninstall";
type PluginFormat = "VST3" | "CLAP" | "MOD Audio";
type ModPlatform = "Duo" | "Duo X" | "Dwarf";
type Plugins = {
  [K in PluginFormat]: K extends "MOD Audio"
    ? Record<ModPlatform, string[]>
    : string[];
};

const modes: Mode[] = ["Install", "Uninstall"];
const initialSelectedPlugins: Plugins = {
  VST3: [],
  CLAP: [],
  "MOD Audio": {
    Duo: [],
    "Duo X": [],
    Dwarf: [],
  },
};

export function PluginManager() {
  const [mode, setMode] = useState<Mode>("Install");
  const [plugins, setPlugins] = useState<Plugins>();
  const [selectedPlugins, setSelectedPlugins] = useState<Plugins>(
    initialSelectedPlugins,
  );
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [selectedModPlatform, setSelectedModPlatform] =
    useState<ModPlatform>("Dwarf");

  const noPluginsSelected =
    !selectedPlugins["CLAP"].length &&
    !selectedPlugins["VST3"].length &&
    !selectedPlugins["MOD Audio"][selectedModPlatform].length;

  async function fetchPlugins() {
    try {
      setIsFetching(true);
      const plugins = await invoke<Plugins>("get_plugins", { mode });
      setPlugins(plugins);
      setSelectedPlugins({
        ...plugins,
        "MOD Audio": selectModAudioPlugins(plugins, selectedModPlatform),
      });
    } catch (e) {
      error(e as string);
    } finally {
      setIsFetching(false);
    }
  }

  async function createPlugins() {
    try {
      await invoke<Plugins>("create_plugins", {
        plugins: selectedPlugins,
      });
    } catch (e) {
      error(e as string);
    }
  }

  async function deletePlugins() {
    try {
      await invoke<Plugins>("delete_plugins", {
        plugins: selectedPlugins,
      });
    } catch (e) {
      error(e as string);
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
      initialSelectedPlugins["MOD Audio"],
    );
  }

  useEffect(() => {
    fetchPlugins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="w-full">
      <h2 className="font-sans text-xl font-bold">Mode</h2>
      <RadioButtonList
        groupName="Mode"
        items={modes}
        selectedItem={mode}
        onChange={(item) => setMode(item)}
        className="mt-2"
      />

      {isFetching && <div>Loading...</div>}

      {plugins && (
        <div className="mt-8">
          <h2 className="font-sans text-xl font-bold">Plugin formats</h2>
          <CheckboxList
            title="VST3"
            items={plugins?.VST3}
            selectedItems={selectedPlugins.VST3}
            onChange={(items) => {
              setSelectedPlugins({ ...selectedPlugins, VST3: items });
            }}
            className="mt-4"
          />
          <CheckboxList
            title="CLAP"
            items={plugins?.CLAP}
            selectedItems={selectedPlugins.CLAP}
            onChange={(items) => {
              setSelectedPlugins({ ...selectedPlugins, CLAP: items });
            }}
            className="mt-4"
          />

          <CheckboxList
            title={selectedModPlatform}
            items={plugins?.["MOD Audio"][selectedModPlatform]}
            selectedItems={selectedPlugins["MOD Audio"][selectedModPlatform]}
            onChange={(items) => {
              setSelectedPlugins({
                ...selectedPlugins,
                "MOD Audio": {
                  ...selectedPlugins["MOD Audio"],
                  [selectedModPlatform]: items,
                },
              });
            }}
            overrideCheckAllComponent={(ref, onCheckAll) => (
              <div className="-ml-8">
                <Checkbox
                  ref={ref}
                  id={"MOD Audio"}
                  name={"MOD Audio"}
                  onChange={onCheckAll}
                />
                <RadioButtonList
                  groupName="MOD Audio"
                  items={Object.keys(plugins["MOD Audio"]) as ModPlatform[]}
                  selectedItem={selectedModPlatform}
                  onChange={(item) => {
                    setSelectedModPlatform(item);
                    setSelectedPlugins({
                      ...selectedPlugins,
                      ["MOD Audio"]: selectModAudioPlugins(plugins, item),
                    });
                  }}
                  className="ml-4 mt-2"
                />
              </div>
            )}
            className="ml-8 mt-4"
          />
        </div>
      )}
      {mode === "Install" && (
        <Button
          onClick={createPlugins}
          disabled={noPluginsSelected}
          className="mt-8"
        >
          Install
        </Button>
      )}
      {mode === "Uninstall" && (
        <Button
          onClick={deletePlugins}
          disabled={noPluginsSelected}
          className="mt-8"
        >
          Uninstall
        </Button>
      )}
    </div>
  );
}
