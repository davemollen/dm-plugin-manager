import axios, { AxiosError, AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { DropZone, DropZoneFile } from "@/components/DropZone";
import JSZip from "jszip";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import {
  CreatePluginsResponse,
  GetPluginsResponse,
} from "@/pages/api/plugins/post/interfaces";
import { useToast } from "@/hooks/useToast";
import { UnsupportedBrowser } from "./HomePage/UnsupportedBrowser";
import { DisconnectedMod } from "./HomePage/DisconnectedMod";
import { Plugin } from "./HomePage/Plugin";
import { invoke } from "@tauri-apps/api/core";
import { info } from "@tauri-apps/plugin-log";

export function HomePage() {
  const zip = new JSZip();
  const formData = new FormData();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modIsDisconnected, setModIsDisconnected] = useState<boolean>(false);
  const [plugins, setPlugins] = useState<string[] | undefined>();
  const { supportsWebkitGetAsEntry } = useBrowserSupport();
  const toast = useToast();

  async function getPlugins() {
    const response: string[] = await invoke("get_plugins");
    info("Info log with response: " + response.join(", "));
    setPlugins(response);
    setIsLoading(false);
    // try {
    //   setIsLoading(true);
    //   setModIsDisconnected(false);
    //   const response: AxiosResponse<GetPluginsResponse> = await axios.get(
    //     "/api/plugins"
    //   );
    //   setPlugins(response.data.plugins);
    // } catch (e) {
    //   handleErrors(e);
    // } finally {
    //   setIsLoading(false);
    // }
  }

  async function addPlugins(formData: FormData) {
    try {
      const response: AxiosResponse<CreatePluginsResponse> = await axios.post(
        "/api/plugins",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const createdPlugins = response.data.plugins;
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

      toast?.success(
        createdPlugins.length > 1
          ? `Added the following plugins: "${createdPlugins.join(",")}."`
          : `Added "${createdPlugins}".`
      );
    } catch (e) {
      handleErrors(e);
    }
  }

  async function removePlugin(name: string) {
    try {
      await axios.delete("/api/plugins", { data: { name } });
      if (plugins) {
        setPlugins(plugins.filter((plugin) => plugin !== name));
      }
      toast?.success(`Removed "${name}".`);
    } catch (e) {
      handleErrors(e);
    }
  }

  function handleErrors(e: unknown) {
    const error = e as AxiosError;
    if (error.response?.status === 503) {
      setModIsDisconnected(true);
    } else {
      toast?.error(error.message);
    }
  }

  async function onFileUpload(files: DropZoneFile[]) {
    await Promise.all(
      files.map(async (file) => {
        const content = await file.arrayBuffer();
        zip.file(file.path || file.webkitRelativePath, content);
      })
    );

    const zipBlob = await zip.generateAsync({ type: "blob" });
    formData.append("zipFile", zipBlob);

    await addPlugins(formData);
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
          onChange={onFileUpload}
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
