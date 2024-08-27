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
        className="disabled:border-steel-400 disabled:bg-steel-400 h-5 w-5 cursor-pointer appearance-none rounded-full border-gray-300 bg-gray-100 checked:bg-blue-400"
      />
      <label
        htmlFor={id}
        className="cursor-pointer select-none font-sans font-semibold"
      >
        {value}
      </label>
      <FontAwesomeIcon
        icon={faCircle}
        className="pointer-events-none absolute ml-1.5 h-2 w-2 cursor-pointer text-foreground"
      />
    </div>
  );
}
