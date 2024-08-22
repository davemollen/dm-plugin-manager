import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

const style: Record<NonNullable<ButtonProps["kind"]>, string> = {
  primary: "bg-cyan-700 hover:bg-cyan-500 text-white hover:shadow-cyan-500/20",
  secondary:
    "bg-black hover:bg-white/10 border-2 border-white text-white hover:shadow-white/20",
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
      className={`flex h-12 items-center rounded-lg px-6 font-sans text-lg font-bold shadow-md ${style[kind]} ${
        props.className ?? ""
      }`}
    />
  );
}
