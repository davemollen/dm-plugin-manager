import { ChangeEvent } from "react";
import { RadioButton } from "./RadioButton";

export function RadioButtonList<T extends string>({
  title,
  items,
  selectedItem,
  onChange,
  className,
}: {
  title: string;
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
      <h4 className="font-sans font-bold">{title}</h4>
      {items.map((item) => (
        <RadioButton
          key={item}
          id={item}
          name={title}
          value={item}
          checked={item === selectedItem}
          onChange={onRadioButtonChange}
        />
      ))}
    </div>
  );
}
