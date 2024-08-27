import { CheckboxList } from "@/components/CheckboxList";
import { RadioButtonList } from "@/components/RadioButtonList";
import { useState } from "react";

type Mode = "Install" | "Uninstall";
const modes: Mode[] = ["Install", "Uninstall"];

type PluginFormats = ("VST3" | "CLAP" | "MOD Audio")[];
const formatItems: PluginFormats = ["VST3", "CLAP", "MOD Audio"];

type ModPlatform = "Duo" | "Duo X" | "Dwarf";
const modPlatforms: ModPlatform[] = ["Duo", "Duo X", "Dwarf"];

export function PluginManager() {
  const [mode, setMode] = useState<Mode>("Install");
  const [selectedFormats, setSelectedFormats] =
    useState<PluginFormats>(formatItems);
  const [selectedModPlatform, setSelectedModPlatform] =
    useState<ModPlatform>("Dwarf");

  return (
    <div className="w-full">
      <RadioButtonList
        title="Mode"
        items={modes}
        selectedItem={mode}
        onChange={(item) => setMode(item)}
      />

      <CheckboxList
        title="Plugin formats"
        items={formatItems}
        selectedItems={selectedFormats}
        onChange={(items) => setSelectedFormats(items)}
        className="mt-8"
      />

      {mode === "Install" && selectedFormats.includes("MOD Audio") && (
        <RadioButtonList
          title="MOD platform"
          items={modPlatforms}
          selectedItem={selectedModPlatform}
          onChange={(items) => setSelectedModPlatform(items)}
          className="mt-8"
        />
      )}
    </div>
  );
}
