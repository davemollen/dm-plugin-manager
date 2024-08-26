import { useCallback, useEffect, useState } from "react";
import { DropZone, DropZoneFile } from "@/components/DropZone";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import { useToast } from "@/hooks/useToast";
import { UnsupportedBrowser } from "./HomePage/UnsupportedBrowser";
import { DisconnectedMod } from "./HomePage/DisconnectedMod";
import { Plugin } from "./HomePage/Plugin";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { commaJoin } from "@/utils/commaJoin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";

export function HomePage() {
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [removals, setRemovals] = useState<string[]>([]);
  const [modIsDisconnected, setModIsDisconnected] = useState<boolean>(false);
  const [plugins, setPlugins] = useState<string[] | undefined>();
  const { supportsWebkitGetAsEntry } = useBrowserSupport();
  const toast = useToast();

  const getPlugins = useCallback(async function () {
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
  }, []);

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
    if (e.startsWith("Invalid address was provided: ")) {
      setModIsDisconnected(true);
    } else {
      toast?.error(e);
    }
  }

  useEffect(() => {
    getPlugins();
  }, [getPlugins]);

  if (supportsWebkitGetAsEntry === false) {
    return <UnsupportedBrowser />;
  }
  if (modIsDisconnected) {
    return <DisconnectedMod getPlugins={getPlugins} />;
  }
  if (isFetching) {
    return (
      <div className="rounded-2xl">
        <div className="w-full bg-black py-6">
          <h3 className="text-3xl tracking-wide">Plugins</h3>
          <div className="animate-pulse">
            <div
              className="mt-6 h-24 w-1/3 min-w-60 rounded-lg bg-gray-200"
              onClick={getPlugins}
            />
          </div>
        </div>
        <ul className="mt-6 animate-pulse columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-2">
          {Array(36)
            .fill(1)
            .map((_, i) => {
              return (
                <li
                  key={i}
                  className="mb-2 last:mb-0 flex h-12 w-full items-center rounded-lg border-2 border-white bg-gray-200 px-2 py-1 text-lg"
                />
              );
            })}
        </ul>
      </div>
    );
  }
  return (
    <div className="rounded-2xl">
      <div className="sticky top-0 w-full border-b-2 border-white bg-black py-6">
        <div className="flex justify-between">
          <h3 className="text-3xl tracking-wide">Plugins</h3>
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
      <ul className="mt-6 columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-2">
        {plugins?.map((name) => {
          return (
            <Plugin
              key={name}
              name={name}
              onRemove={removePlugin}
              isRemoving={removals.includes(name)}
              className="mb-2 last:mb-0"
            />
          );
        })}
      </ul>
    </div>
  );
}
