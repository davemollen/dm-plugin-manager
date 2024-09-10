import { CheckboxListSkeleton } from "@/components/CheckboxList";
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
          <CheckboxListSkeleton
            count={6}
            kind="bordered"
            className="w-full max-w-sm"
          />
        )}
      </div>
    </div>
  );
}
