import { Button } from "@/components/Button";
import { CheckboxList } from "@/components/CheckboxList";
import { RadioButtonList } from "@/components/RadioButtonList";
import { FolderInput } from "@/pages/PluginManagerPage1/FolderInput";
import { getDefaultPluginFolders } from "./PluginManagerPage1/getDefaultPluginFolders";
import { usePluginContext } from "@/hooks/usePluginContext";
import { useNavigate } from "react-router-dom";
import { type } from "@tauri-apps/plugin-os";

export function PluginManagerPage1() {
  const {
    mode,
    selectedPluginFormats,
    selectedModPlatform,
    pluginFolders,
    setMode,
    setSelectedPluginFormats,
    setSelectedModPlatform,
    onPluginFolderChange,
  } = usePluginContext();
  const navigate = useNavigate();
  const osType = type();

  const {
    defaultVst3Folder,
    defaultClapFolder,
    defaultLV2Folder,
    defaultAUv2Folder,
  } = getDefaultPluginFolders();

  function onSubmit() {
    navigate("plugin-manager-page-2");
  }

  return (
    <div className="w-full">
      <RadioButtonList
        groupName="Mode"
        items={["Install", "Uninstall"]}
        selectedItem={mode}
        onChange={setMode}
        className="w-36"
        kind="bordered"
      />

      <CheckboxList
        title="Plugin formats"
        items={{
          VST3: "VST3",
          CLAP: "CLAP",
          ...(osType === "macos" ? { AUv2: "AUv2" } : undefined),
          LV2: "LV2 / MOD Desktop",
          "MOD Audio": "MOD Audio",
        }}
        selectedItems={selectedPluginFormats}
        onChange={setSelectedPluginFormats}
        kind="bordered"
        className="mt-6 max-w-sm"
      />

      {selectedPluginFormats.includes("MOD Audio") && (
        <>
          <h4 className="mt-6 font-sans text-lg font-bold">MOD platform</h4>
          <RadioButtonList
            groupName="MOD platform"
            items={["Duo", "DuoX", "Dwarf"]}
            selectedItem={selectedModPlatform}
            onChange={setSelectedModPlatform}
            kind="bordered"
            className="mt-2 w-36"
          />
        </>
      )}

      {(selectedPluginFormats.includes("VST3") ||
        selectedPluginFormats.includes("CLAP") ||
        selectedPluginFormats.includes("AUv2") ||
        selectedPluginFormats.includes("LV2")) && (
        <>
          <h4 className="mt-6 font-sans text-lg font-bold">Plugin location</h4>
          <div className="mt-2 flex w-fit flex-col items-stretch gap-4">
            {selectedPluginFormats.includes("VST3") && (
              <div className="flex items-center gap-4">
                <p className="w-20 font-sans">VST3:</p>
                <FolderInput
                  id="VST3-folder"
                  label="Location: "
                  name="vst3Folder"
                  value={pluginFolders.vst3Folder ?? defaultVst3Folder}
                  onChange={onPluginFolderChange}
                  className="flex-1"
                />
              </div>
            )}
            {selectedPluginFormats.includes("CLAP") && (
              <div className="flex items-center gap-4">
                <p className="w-20 font-sans">CLAP:</p>
                <FolderInput
                  id="CLAP-folder"
                  label="Location: "
                  name="clapFolder"
                  value={pluginFolders.clapFolder ?? defaultClapFolder}
                  onChange={onPluginFolderChange}
                  className="flex-1"
                />
              </div>
            )}
            {osType === "macos" && selectedPluginFormats.includes("AUv2") && (
              <div className="flex items-center gap-4">
                <p className="w-20 font-sans">AUv2:</p>
                <FolderInput
                  id="AUv2-folder"
                  label="Location: "
                  name="auv2Folder"
                  value={pluginFolders.auv2Folder ?? defaultAUv2Folder}
                  onChange={onPluginFolderChange}
                  className="flex-1"
                />
              </div>
            )}
            {selectedPluginFormats.includes("LV2") && (
              <div className="flex items-center gap-4">
                <p className="w-20 font-sans">LV2 / MOD Desktop:</p>
                <FolderInput
                  id="LV2-folder"
                  label="Location: "
                  name="lv2Folder"
                  value={pluginFolders.lv2Folder ?? defaultLV2Folder}
                  onChange={onPluginFolderChange}
                  className="flex-1"
                />
              </div>
            )}
          </div>
        </>
      )}
      <div className="sticky bottom-4 mt-6 inline-block rounded-lg bg-background">
        <Button
          disabled={selectedPluginFormats.length === 0}
          onClick={onSubmit}
        >
          Proceed
        </Button>
      </div>
    </div>
  );
}
