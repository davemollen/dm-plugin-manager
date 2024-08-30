import { faSpinner } from "@fortawesome/free-solid-svg-icons/faSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from "react";

const style: Record<NonNullable<ButtonProps["kind"]>, string> = {
  primary:
    "bg-cta [&:not(:disabled)]:hover:bg-ctaHover text-white [&:not(:disabled)]:hover:shadow-cta/30",
  secondary:
    "bg-background [&:not(:disabled)]:hover:bg-foreground/10 border-2 border-foreground shadow-foreground/10 text-foreground [&:not(:disabled)]:hover:shadow-foreground/20",
};

export interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  children: ReactNode;
  isLoading?: boolean;
  kind?: "primary" | "secondary";
}

export function Button({
  children,
  isLoading,
  kind = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`flex h-12 items-center justify-between gap-2 rounded-lg px-6 font-sans text-lg font-bold shadow-lg ${style[kind]} disabled:cursor-default disabled:opacity-50 ${
        className ?? ""
      }`}
    >
      <span>{children}</span>
      {isLoading && (
        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
      )}
    </button>
  );
}

export function ButtonSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`h-12 w-40 animate-pulse rounded-lg bg-gray-200 ${className ?? ""}`.trim()}
    ></div>
  );
}
