import { ChangeEvent, useEffect, useRef } from "react";
import { Checkbox } from "./Checkbox";

export function CheckboxList<T extends string>({
  title,
  items,
  selectedItems,
  onChange,
  className,
}: {
  title: string;
  items: T[];
  selectedItems: T[];
  onChange: (selectedItems: T[]) => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function onCheckAll(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.checked) {
      onChange(items);
    } else {
      onChange([]);
    }
  }

  function onCheckboxChange(event: ChangeEvent<HTMLInputElement>) {
    const { id, checked } = event.target;

    if (checked) {
      onChange([...selectedItems, id as T]);
    } else {
      onChange(selectedItems.filter((item) => item != id));
    }
  }

  useEffect(() => {
    function predicate(item: T) {
      return selectedItems.includes(item);
    }

    if (ref.current) {
      ref.current.indeterminate = !items.every(predicate);
      ref.current.checked = items.some(predicate);
    }
  }, [selectedItems, ref]);

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`.trim()}>
      <Checkbox ref={ref} id={title} name={title} onChange={onCheckAll} />
      {items.map((item) => (
        <Checkbox
          key={item}
          id={item}
          name={title}
          onChange={onCheckboxChange}
          checked={selectedItems.includes(item)}
          className="ml-4"
        />
      ))}
    </div>
  );
}
