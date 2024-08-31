import { ChangeEvent } from "react";
import { RadioButton, RadioButtonSkeleton } from "./RadioButton";

type Kind = "default" | "bordered";
const style: Record<Kind, string> = {
  default: "gap-2",
  bordered: "gap-0 border border-panel rounded-xl",
};
const radioButtonStyle: Record<Kind, string> = {
  default: "",
  bordered: "border-b border-panel p-2 last:border-none",
};

export function RadioButtonList<T extends string>({
  groupName,
  items,
  selectedItem,
  kind = "default",
  onChange,
  disabled,
  className,
  radioButtonClassName,
}: {
  groupName: string;
  items: T[];
  selectedItem: T;
  kind?: Kind;
  onChange: (item: T) => void;
  disabled?: boolean;
  className?: string;
  radioButtonClassName?: string;
}) {
  function onRadioButtonChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value as T);
  }

  return (
    <div className={`flex flex-col ${style[kind]} ${className ?? ""}`.trim()}>
      {items.map((item) => (
        <RadioButton
          key={item}
          id={item}
          name={groupName}
          value={item}
          checked={item === selectedItem}
          disabled={disabled}
          onChange={onRadioButtonChange}
          className={`${radioButtonStyle[kind]} ${radioButtonClassName}`.trim()}
        />
      ))}
    </div>
  );
}

export function RadioButtonListSkeleton({
  count,
  kind = "default",
  className,
  radioButtonClassName,
}: {
  count: number;
  kind?: Kind;
  className?: string;
  radioButtonClassName?: string;
}) {
  return (
    <div className={`flex flex-col ${style[kind]} ${className ?? ""}`.trim()}>
      {[...Array(count).keys()].map((i) => (
        <RadioButtonSkeleton
          key={i}
          className={`${radioButtonStyle[kind]} ${radioButtonClassName}`.trim()}
        />
      ))}
    </div>
  );
}
