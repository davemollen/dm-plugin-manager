import { useEffect, useState } from "react";
import { DropZone, DropZoneFile } from "@/components/DropZone";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import { useToast } from "@/hooks/useToast";
import { UnsupportedBrowser } from "./ModPluginManager/UnsupportedBrowser";
import { DisconnectedMod } from "./ModPluginManager/DisconnectedMod";
import { Plugin } from "./ModPluginManager/Plugin";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { commaJoin } from "@/utils/commaJoin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";

export function ModPluginManager() {
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [removals, setRemovals] = useState<string[]>([]);
  const [modIsDisconnected, setModIsDisconnected] = useState<boolean>(false);
  const [plugins, setPlugins] = useState<string[] | undefined>();
  const { supportsWebkitGetAsEntry } = useBrowserSupport();
  const toast = useToast();

  async function getPlugins() {
    try {
      setIsFetching(true);
      setModIsDisconnected(false);
      const plugins = await invoke<string[]>("get_plugins");
      setPlugins(plugins);
    } catch (e) {
      handleErrors(e);
    } finally {
      setIsFetching(false);
    }
  }

  async function addPlugins(dropZoneFiles: DropZoneFile[]) {
    try {
      setModIsDisconnected(false);
      setIsCreating(true);
      const files = await Promise.all(
        dropZoneFiles.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          return {
            path: file.path || file.webkitRelativePath,
            buffer: Array.from(new Uint8Array(arrayBuffer)),
          };
        })
      );
      const createdPlugins = await invoke<string[]>("create_plugins", {
        files,
      });
      if (plugins) {
        setPlugins(
          createdPlugins
            .reduce(
              (result, item) =>
                result.includes(item) ? result : [...result, item],
              [...plugins]
            )
            .sort()
        );
      }

      toast?.success(`Added ${commaJoin(createdPlugins)}.`);
    } catch (e) {
      handleErrors(e);
    } finally {
      setIsCreating(false);
    }
  }

  async function removePlugin(name: string) {
    try {
      setRemovals([...removals, name]);
      setModIsDisconnected(false);
      await invoke<void>("delete_plugin", {
        name,
      });
      if (plugins) {
        setPlugins(plugins.filter((plugin) => plugin !== name));
      }
      toast?.success(`Removed "${name}".`);
    } catch (e) {
      handleErrors(e);
    } finally {
      setRemovals(removals.filter((removal) => removal !== name));
    }
  }

  function handleErrors(err: unknown) {
    const e = err as string;
    error("Handle error log: " + e);
    if (e === "Ssh connection timed out") {
      setModIsDisconnected(true);
    } else {
      toast?.error(e);
    }
  }

  useEffect(() => {
    getPlugins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (supportsWebkitGetAsEntry === false) {
    return <UnsupportedBrowser />;
  }
  if (modIsDisconnected) {
    return <DisconnectedMod getPlugins={getPlugins} />;
  }
  if (isFetching) {
    return (
      <div className="rounded-2xl">
        <div className="sticky top-0 w-full border-b-2 border-gray-600 bg-black pt-4 pb-6 z-10 -mt-4">
          <div
            className="h-24 w-1/3 min-w-60 rounded-lg bg-gray-200 animate-pulse"
            onClick={getPlugins}
          />
        </div>

        <ul className="mt-6 grid animate-pulse grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array(36)
            .fill(1)
            .map((_, i) => {
              return (
                <li
                  key={i}
                  className="flex h-12 w-full items-center rounded-lg border-2 border-white bg-gray-200 px-2 py-1 text-lg"
                />
              );
            })}
        </ul>
      </div>
    );
  }
  return (
    <div className="rounded-2xl">
      <div className="sticky top-0 w-full border-b-2 border-white bg-black py-6 z-10">
        <div className="flex justify-between">
          <button
            onClick={getPlugins}
            className="flex gap-2 hover:text-blue-400"
          >
            <span>Refresh</span>
            <FontAwesomeIcon icon={faRefresh} size="xl" />
          </button>
        </div>
        <DropZone
          onChange={addPlugins}
          allowedFileTypes={[".lv2"]}
          isLoading={isCreating}
          disabled={isCreating}
          className="w-1/3 min-w-60 rounded-xl"
        />
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {plugins?.map((name) => {
          return (
            <Plugin
              key={name}
              name={name}
              onRemove={removePlugin}
              isRemoving={removals.includes(name)}
            />
          );
        })}
      </ul>
    </div>
  );
}
