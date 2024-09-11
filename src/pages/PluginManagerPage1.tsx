import { Button } from "@/components/Button";
import { CheckboxList } from "@/components/CheckboxList";
import { RadioButtonList } from "@/components/RadioButtonList";
import { FolderInput } from "@/pages/PluginManagerPage1/FolderInput";
import { getDefaultPluginFolders } from "./PluginManagerPage1/getDefaultPluginFolders";
import { usePluginContext } from "@/hooks/usePluginContext";
import { useNavigate } from "react-router-dom";

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

  const showFolderSelector =
    selectedPluginFormats.includes("VST3") ||
    selectedPluginFormats.includes("CLAP");
  const showModPlatformSelector = selectedPluginFormats.includes("MOD Audio");
  const { defaultVst3Folder, defaultClapFolder } = getDefaultPluginFolders();

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
        items={["VST3", "CLAP", "MOD Audio"]}
        selectedItems={selectedPluginFormats}
        onChange={setSelectedPluginFormats}
        kind="bordered"
        className="mt-6 max-w-sm"
      />

      {showModPlatformSelector && (
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

      {showFolderSelector && (
        <>
          <h4 className="mt-6 font-sans text-lg font-bold">Plugin location</h4>
          <div className="mt-2 flex flex-col gap-2">
            {selectedPluginFormats.includes("VST3") && (
              <div className="flex items-center gap-2">
                <p className="font-sans">VST3:</p>
                <FolderInput
                  id="VST3-folder"
                  label="Location: "
                  name="vst3Folder"
                  value={pluginFolders.vst3Folder ?? defaultVst3Folder}
                  onChange={onPluginFolderChange}
                />
              </div>
            )}
            {selectedPluginFormats.includes("CLAP") && (
              <div className="flex items-center gap-2">
                <p className="font-sans">CLAP:</p>
                <FolderInput
                  id="CLAP-folder"
                  label="Location: "
                  name="clapFolder"
                  value={pluginFolders.clapFolder ?? defaultClapFolder}
                  onChange={onPluginFolderChange}
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
