import { useEffect, useState } from "react";
import { DropZone, DropZoneFile } from "@/components/DropZone";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import { useToastContext } from "@/hooks/useToastContext";
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
  const toast = useToastContext();

  async function getPlugins() {
    try {
      setIsFetching(true);
      setModIsDisconnected(false);
      const plugins = await invoke<string[]>("get_mod_plugins");
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
        }),
      );
      const createdPlugins = await invoke<string[]>("create_mod_plugins", {
        files,
      });
      if (plugins) {
        setPlugins(
          createdPlugins
            .reduce(
              (result, item) =>
                result.includes(item) ? result : [...result, item],
              [...plugins],
            )
            .sort(),
        );
      }

      toast?.success(`Added ${commaJoin(createdPlugins)}`);
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
      await invoke<void>("delete_mod_plugin", {
        name,
      });
      if (plugins) {
        setPlugins(plugins.filter((plugin) => plugin !== name));
      }
      toast?.success(`Removed "${name}"`);
    } catch (e) {
      handleErrors(e);
    } finally {
      setRemovals(removals.filter((removal) => removal !== name));
    }
  }

  function handleErrors(err: unknown) {
    const e = err as string;
    error("Handle error log: " + e);
    if (e === "Unable to connect with MOD") {
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
    return <DisconnectedMod reconnect={getPlugins} />;
  }
  if (isFetching) {
    return (
      <div>
        <div className="sticky top-0 z-10 -mt-6 flex w-full border-b-2 border-foreground bg-background py-6">
          <div
            className="h-32 w-1/3 min-w-60 animate-pulse rounded-lg bg-gray-200"
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
    <div>
      <div className="sticky top-0 z-10 -mt-6 flex w-full border-b-2 border-foreground bg-background py-6">
        <DropZone
          onChange={addPlugins}
          allowedFileTypes={[".lv2"]}
          isLoading={isCreating}
          disabled={isCreating}
          className="w-1/3 min-w-60 rounded-xl"
        />
        <button
          onClick={getPlugins}
          className="flex flex-1 justify-end gap-2 hover:text-link"
        >
          <span>Refresh</span>
          <FontAwesomeIcon icon={faRefresh} size="xl" />
        </button>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {plugins?.map((name) => {
          return (
            <Plugin
              key={name}
              name={name}
              canBeRemoved={name.startsWith("dm-")}
              onRemove={removePlugin}
              isRemoving={removals.includes(name)}
            />
          );
        })}
      </ul>
    </div>
  );
}
