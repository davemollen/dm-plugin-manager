import { ReactNode } from "react";
import { useBreakPoint } from "@/hooks/useBreakPoint";
import { DefaultNavigation } from "./DefaultNavigation";
import { SmallNavigation } from "./SmallNavigation";

export function Navigation({ children }: { children: ReactNode }) {
  const activeBreakPoint = useBreakPoint();

  return (
    <div
      className={`relative flex w-full font-mono text-base ${activeBreakPoint === undefined ? "flex-col" : "flex-row"}`}
    >
      <DefaultNavigation />
      <SmallNavigation activeBreakPoint={activeBreakPoint} />
      {children}
    </div>
  );
}
