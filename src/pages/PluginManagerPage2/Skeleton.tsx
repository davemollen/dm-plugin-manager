import { CheckboxSkeleton } from "@/components/Checkbox";
import { CheckboxListSkeleton } from "@/components/CheckboxList";
import { RadioButtonListSkeleton } from "@/components/RadioButtonList";
import { usePluginContext } from "@/hooks/usePluginContext";

export function Skeleton() {
  const { selectedPluginFormats } = usePluginContext();

  return (
    <div className="w-full">
      <h4 className="font-sans text-xl font-bold">Plugin selection</h4>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        {selectedPluginFormats.includes("VST3") && (
          <CheckboxListSkeleton
            count={3}
            kind="bordered"
            className="w-full max-w-sm"
          />
        )}
        {selectedPluginFormats.includes("CLAP") && (
          <CheckboxListSkeleton
            count={4}
            kind="bordered"
            className="w-full max-w-sm"
          />
        )}
        {selectedPluginFormats.includes("MOD Audio") && (
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-panel">
            <CheckboxSkeleton className="bg-panel p-2" />
            <RadioButtonListSkeleton
              count={3}
              kind="bordered"
              className="!rounded-none !border-l-0 !border-r-0"
              radioButtonClassName="pl-4"
            />
            <CheckboxListSkeleton
              count={4}
              kind="bordered"
              enableCheckAll={false}
              className="!rounded-none !border-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
