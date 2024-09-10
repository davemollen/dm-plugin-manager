import { Button } from "@/components/Button";
import { CheckboxList } from "@/components/CheckboxList";
import { useToastContext } from "@/hooks/useToastContext";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { DisconnectedMod } from "./PluginManagerPage2/DisconnectedMod";
import { error } from "@tauri-apps/plugin-log";
import { Skeleton } from "./PluginManagerPage2/Skeleton";
import { usePluginContext } from "@/hooks/usePluginContext";
import { useNavigate } from "react-router-dom";
import { FetchPluginsResponse, SelectedPlugins } from "@/models/plugins";

const initialPlugins: FetchPluginsResponse = {
  VST3: [],
  CLAP: [],
  "MOD Audio": [],
  modIsConnected: undefined,
};

export function PluginManagerPage2() {
  const { mode, selectedPluginFormats, selectedModPlatform, pluginFolders } =
    usePluginContext();
  const [plugins, setPlugins] = useState<FetchPluginsResponse>(initialPlugins);
  const [selectedPlugins, setSelectedPlugins] = useState<SelectedPlugins>({
    ...initialPlugins,
    "MOD Audio": initialPlugins["MOD Audio"],
  });
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const toast = useToastContext();
  const navigate = useNavigate();

  const noPluginsSelected =
    !selectedPlugins.VST3?.length &&
    !selectedPlugins.CLAP?.length &&
    !selectedPlugins["MOD Audio"]?.length;

  async function fetchPlugins() {
    try {
      setIsFetching(true);

      const plugins =
        mode === "Install"
          ? await invoke<FetchPluginsResponse>("get_installable_plugins", {
              pluginFormats: selectedPluginFormats,
              modPlatform: selectedModPlatform,
            })
          : await invoke<FetchPluginsResponse>("get_installed_plugins", {
              ...pluginFolders,
              pluginFormats: selectedPluginFormats,
              modPlatform: selectedModPlatform,
            });
      setPlugins(plugins);
      setSelectedPlugins({
        ...plugins,
        "MOD Audio": plugins.modIsConnected ? plugins["MOD Audio"] : [],
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
      await invoke("create_plugins", {
        plugins: selectedPlugins,
        modPlatform: selectedModPlatform,
        ...pluginFolders,
      });
      navigate("/plugin-manager-success");
    } catch (e) {
      error(e as string);
      navigate("/plugin-manager-error", { state: { error: e as string } });
    } finally {
      setIsProcessing(false);
    }
  }

  async function deletePlugins() {
    try {
      await invoke("delete_plugins", {
        plugins: selectedPlugins,
        ...pluginFolders,
      });
      navigate("/plugin-manager-success");
    } catch (e) {
      error(e as string);
      navigate("/plugin-manager-error", { state: { error: e as string } });
    }
  }

  function goBack() {
    navigate(-1);
  }

  useEffect(() => {
    fetchPlugins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (isFetching) {
    return <Skeleton />;
  }
  return (
    <div className="w-full">
      <h4 className="font-sans text-xl font-bold">Plugin selection</h4>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        {selectedPluginFormats.includes("VST3") && (
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
            emptyComponent={
              <p className="py-4 pl-6 pr-2 text-sm">
                {mode === "Install"
                  ? "No plugins to install."
                  : "No plugins installed. Change the folder location if you have stored your plugins in a different place."}
              </p>
            }
          />
        )}

        {selectedPluginFormats.includes("CLAP") && (
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
            emptyComponent={
              <p className="py-4 pl-6 pr-2 text-sm">
                {mode === "Install"
                  ? "No plugins to install."
                  : "No plugins installed. Change the folder location if you have stored your plugins in a different place."}
              </p>
            }
          />
        )}

        {selectedPluginFormats.includes("MOD Audio") && (
          <CheckboxList
            title={`MOD ${selectedModPlatform}`}
            items={plugins.modIsConnected ? plugins["MOD Audio"] : []}
            selectedItems={selectedPlugins["MOD Audio"]}
            disabled={
              isProcessing ||
              !plugins.modIsConnected ||
              !plugins["MOD Audio"].length
            }
            onChange={(items) => {
              setSelectedPlugins({
                ...selectedPlugins,
                "MOD Audio": items,
              });
            }}
            kind="bordered"
            className="max-w-sm"
            checkboxClassName={mode === "Install" ? "!pl-10" : "!pl-6"}
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
        )}
      </div>

      <div className="sticky bottom-4 mt-8 flex items-center gap-2">
        <div className="rounded-lg bg-background">
          <Button
            disabled={selectedPluginFormats.length === 0}
            kind="secondary"
            onClick={goBack}
          >
            Go back
          </Button>
        </div>
        {!noPluginsSelected && (
          <div className="rounded-lg bg-background">
            <Button
              isLoading={isProcessing}
              disabled={isProcessing}
              onClick={mode === "Install" ? createPlugins : deletePlugins}
            >
              {mode} plugins
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
