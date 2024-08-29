import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DetailedHTMLProps, InputHTMLAttributes } from "react";

interface RadioButtonProps
  extends Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    "type"
  > {}

export function RadioButton({
  id,
  name,
  value,
  className,
  ...props
}: RadioButtonProps) {
  return (
    <div className={`relative flex items-center gap-2 ${className ?? ""}`}>
      <input
        {...props}
        type="radio"
        id={id}
        name={name}
        value={value}
        className="border-1 peer h-5 w-5 cursor-pointer appearance-none rounded-full bg-gray-200 checked:bg-blue-500 disabled:cursor-default"
      />
      <label
        htmlFor={id}
        className="cursor-pointer select-none font-sans font-semibold peer-disabled:cursor-default peer-disabled:opacity-50"
      >
        {value}
      </label>
      <FontAwesomeIcon
        icon={faCircle}
        className="pointer-events-none absolute ml-1.5 hidden h-2 w-2 cursor-pointer text-gray-50 peer-checked:block"
      />
    </div>
  );
}

export function RadioButtonSkeleton({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`.trim()}>
      <div className="h-5 w-5 rounded-full bg-gray-200" />
      <div className="h-6 w-24 rounded-lg bg-gray-200" />
    </div>
  );
}
