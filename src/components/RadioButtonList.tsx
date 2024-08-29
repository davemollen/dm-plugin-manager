import { ChangeEvent } from "react";
import { RadioButton, RadioButtonSkeleton } from "./RadioButton";

export function RadioButtonList<T extends string>({
  groupName,
  items,
  selectedItem,
  onChange,
  className,
}: {
  groupName: string;
  items: T[];
  selectedItem: T;
  onChange: (item: T) => void;
  className?: string;
}) {
  function onRadioButtonChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value as T);
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`.trim()}>
      {items.map((item) => (
        <RadioButton
          key={item}
          id={item}
          name={groupName}
          value={item}
          checked={item === selectedItem}
          onChange={onRadioButtonChange}
        />
      ))}
    </div>
  );
}

export function RadioButtonListSkeleton({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <div
      className={`flex animate-pulse flex-col gap-2 ${className ?? ""}`.trim()}
    >
      {[...Array(count).keys()].map((i) => (
        <RadioButtonSkeleton key={i} />
      ))}
    </div>
  );
}
