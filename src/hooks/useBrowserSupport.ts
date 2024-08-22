import { useMemo } from "react";

export function useBrowserSupport() {
  const result = useMemo(() => {
    const supportsWebkitGetAsEntry =
      typeof window !== "undefined"
        ? "webkitGetAsEntry" in DataTransferItem.prototype
        : undefined;

    return { supportsWebkitGetAsEntry };
  }, []);

  return result;
}
