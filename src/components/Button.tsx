import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

const style: Record<NonNullable<ButtonProps["kind"]>, string> = {
  primary: "bg-cta hover:bg-ctaHover text-white hover:shadow-cta/20",
  secondary:
    "bg-background hover:bg-foreground/10 border-2 border-foreground text-foreground hover:shadow-foreground/20",
};

export interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  kind?: "primary" | "secondary";
}

export function Button({ kind = "primary", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`flex h-12 items-center rounded-lg px-6 font-sans text-lg font-bold shadow-md ${style[kind]} disabled:cursor-default disabled:opacity-50 ${
        props.className ?? ""
      }`}
    />
  );
}
