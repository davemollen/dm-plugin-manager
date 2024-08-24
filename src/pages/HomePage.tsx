import { useEffect, useState } from "react";
import { DropZone, DropZoneFile } from "@/components/DropZone";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import { useToast } from "@/hooks/useToast";
import { UnsupportedBrowser } from "./HomePage/UnsupportedBrowser";
import { DisconnectedMod } from "./HomePage/DisconnectedMod";
import { Plugin } from "./HomePage/Plugin";
import { invoke } from "@tauri-apps/api/core";
import { error, info } from "@tauri-apps/plugin-log";
import { commaJoin } from "@/utils/commaJoin";

export function HomePage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modIsDisconnected, setModIsDisconnected] = useState<boolean>(false);
  const [plugins, setPlugins] = useState<string[] | undefined>();
  const { supportsWebkitGetAsEntry } = useBrowserSupport();
  const toast = useToast();

  async function getPlugins() {
    try {
      setIsLoading(true);
      setModIsDisconnected(false);
      const plugins = await invoke<string[]>("get_plugins");
      info("done loading plugins" + plugins);
      setPlugins(plugins);
    } catch (e) {
      handleErrors(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function addPlugins(dropZoneFiles: DropZoneFile[]) {
    try {
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
      console.log("createdPlugins", createdPlugins);
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
    }
  }

  async function removePlugin(name: string) {
    try {
      await invoke<void>("delete_plugin", {
        name,
      });
      if (plugins) {
        setPlugins(plugins.filter((plugin) => plugin !== name));
      }
      toast?.success(`Removed "${name}".`);
    } catch (e) {
      handleErrors(e);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (supportsWebkitGetAsEntry === false) {
    return <UnsupportedBrowser />;
  }
  if (modIsDisconnected) {
    return <DisconnectedMod getPlugins={getPlugins} />;
  }
  if (isLoading) {
    return (
      <div className="rounded-2xl p-6 pt-0">
        <div className="w-full bg-black py-6">
          <h3 className="text-3xl tracking-wide">Plugins</h3>
          <div className="animate-pulse">
            <div
              className="mt-6 h-24 w-1/3 min-w-60 rounded-lg bg-gray-200"
              onClick={getPlugins}
            />
          </div>
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
    <div className="rounded-2xl p-6 pt-0">
      <div className="sticky top-0 w-full border-b-2 border-white bg-black py-6">
        <h3 className="text-3xl tracking-wide">Plugins</h3>
        <DropZone
          onChange={addPlugins}
          allowedFileTypes={[".lv2"]}
          className="w-1/3 min-w-60 rounded-xl"
        />
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {plugins?.map((name) => {
          return <Plugin key={name} name={name} onRemove={removePlugin} />;
        })}
      </ul>
    </div>
  );
}
