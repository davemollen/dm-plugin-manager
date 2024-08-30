import { ChangeEvent, ReactNode, RefObject, useEffect, useRef } from "react";
import { Checkbox, CheckboxSkeleton } from "./Checkbox";

export function CheckboxList<T extends string>({
  title,
  items,
  selectedItems,
  onChange,
  overrideCheckAllComponent,
  disabled,
  className,
}: {
  title: string;
  items: T[];
  selectedItems: T[];
  onChange: (selectedItems: T[]) => void;
  overrideCheckAllComponent?: (props: {
    ref: RefObject<HTMLInputElement>;
    onCheckAll: (event: ChangeEvent<HTMLInputElement>) => void;
  }) => ReactNode;
  disabled?: boolean;
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
    const { value, checked } = event.target;

    if (checked) {
      onChange([...selectedItems, value as T]);
    } else {
      onChange(selectedItems.filter((item) => item != value));
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
    <div
      className={`flex max-w-xs flex-col overflow-hidden rounded-xl border border-panel ${className ?? ""}`.trim()}
    >
      {overrideCheckAllComponent ? (
        overrideCheckAllComponent({ ref, onCheckAll })
      ) : (
        <Checkbox
          ref={ref}
          id={title}
          name={title}
          value={title}
          disabled={disabled}
          onChange={onCheckAll}
          className="bg-panel p-2"
        />
      )}
      {items.map((item) => (
        <Checkbox
          key={item}
          id={item + title}
          name={title}
          value={item}
          onChange={onCheckboxChange}
          checked={selectedItems.includes(item)}
          disabled={disabled}
          className="border-b border-panel p-2 pl-6 last:border-none"
        />
      ))}
    </div>
  );
}

export function CheckboxListSkeleton({
  count,
  enableCheckAll = true,
  className,
}: {
  count: number;
  enableCheckAll?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex max-w-xs flex-col overflow-hidden rounded-xl border border-panel ${className ?? ""}`.trim()}
    >
      {enableCheckAll && <CheckboxSkeleton className="bg-panel p-2" />}
      {[...Array(count).keys()].map((i) => (
        <CheckboxSkeleton
          key={i}
          className="border-b border-panel p-2 pl-6 last:border-none"
        />
      ))}
    </div>
  );
}
