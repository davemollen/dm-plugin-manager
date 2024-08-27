import { CheckboxList } from "@/components/CheckboxList";
import { useState } from "react";

export function PluginManager() {
  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    "VST3",
    "CLAP",
    "MOD Audio",
  ]);
  const [selectedModPlatform, setSelectedModPlatform] = useState<string[]>([
    "Duo",
    "Duo X",
    "Dwarf",
  ]);

  return (
    <div className="w-full">
      <CheckboxList
        title="Plugin formats"
        items={["VST3", "CLAP", "MOD Audio"]}
        selectedItems={selectedFormats}
        onChange={(items) => setSelectedFormats(items)}
      />
      {selectedFormats.includes("MOD Audio") && (
        <CheckboxList
          title="MOD platforms"
          items={["Duo", "Duo X", "Dwarf"]}
          selectedItems={selectedModPlatform}
          onChange={(items) => setSelectedModPlatform(items)}
          className="mt-8"
        />
      )}
    </div>
  );
}
