import { relaunch } from "@tauri-apps/plugin-process";
import { check, Update } from "@tauri-apps/plugin-updater";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import { ProgressBar } from "./ProgressBar";
import { useToastContext } from "@/hooks/useToastContext";
import { error } from "@tauri-apps/plugin-log";

export function AppUpdater() {
  const ref = useRef<HTMLDivElement>(null);
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const toast = useToastContext();

  async function updateApp() {
    if (!update) return;

    setIsUpdating(true);
    let downloaded = 0;
    let contentLength = 0;

    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            setProgress(0);
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            setProgress(downloaded / contentLength);
            break;
          case "Finished":
            setProgress(100);
            break;
        }
      });
      await relaunch();
    } catch (e) {
      error(e as string);
      toast?.error(e as string);
    } finally {
      setIsUpdating(false);
    }
  }

  async function checkForUpdate() {
    const update = await check();
    setUpdate(update);
  }

  function onClickOutside(event: MouseEvent<HTMLDivElement>) {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      close();
    }
  }

  async function close() {
    await update?.close();
    setUpdate(null);
  }

  useEffect(() => {
    checkForUpdate();
  }, []);

  if (!update) {
    return null;
  }
  return (
    <div
      id="app-update"
      onClick={onClickOutside}
      className="fixed bottom-0 left-0 right-0 top-0 flex items-center justify-center bg-background/50"
    >
      <div
        ref={ref}
        className="max-h-full w-2/3 rounded-xl border border-foreground bg-background p-4"
      >
        <h2 className="font-sans text-3xl font-bold">App update available</h2>
        <p className="mt-2">Current version: {update.currentVersion}</p>
        <p>New version: {update.version}</p>
        <p>Release notes: {update.body}</p>
        {isUpdating && <ProgressBar progress={progress} className="mt-4" />}
        <div className="mt-4 flex gap-4">
          <Button onClick={updateApp} disabled={isUpdating}>
            Update app
          </Button>
          <Button onClick={close} kind="secondary" disabled={isUpdating}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
