import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

const style: Record<NonNullable<ButtonProps["kind"]>, string> = {
  primary: "bg-cta hover:bg-ctaHover text-white hover:shadow-cta/30",
  secondary:
    "bg-background hover:bg-foreground/10 border-2 border-foreground shadow-foreground/10 text-foreground hover:shadow-foreground/20",
};

export interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  kind?: "primary" | "secondary";
}

export function Button({ kind = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`flex h-12 items-center justify-center rounded-lg px-6 font-sans text-lg font-bold shadow-lg ${style[kind]} disabled:cursor-default disabled:opacity-50 ${
        className ?? ""
      }`}
    />
  );
}
