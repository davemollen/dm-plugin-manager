import { ChangeEvent, ReactNode, RefObject, useEffect, useRef } from "react";
import { Checkbox, CheckboxSkeleton } from "./Checkbox";

export function CheckboxList<T extends string>({
  title,
  items,
  selectedItems,
  onChange,
  overrideCheckAllComponent,
  className,
}: {
  title: string;
  items: T[];
  selectedItems: T[];
  onChange: (selectedItems: T[]) => void;
  overrideCheckAllComponent?: (
    ref: RefObject<HTMLInputElement>,
    onCheckAll: (event: ChangeEvent<HTMLInputElement>) => void,
  ) => ReactNode;
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
      {overrideCheckAllComponent ? (
        overrideCheckAllComponent(ref, onCheckAll)
      ) : (
        <Checkbox ref={ref} id={title} name={title} onChange={onCheckAll} />
      )}
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
      className={`flex animate-pulse flex-col gap-2 ${className ?? ""}`.trim()}
    >
      {enableCheckAll && <CheckboxSkeleton />}
      {[...Array(count).keys()].map((i) => (
        <CheckboxSkeleton key={i} className="ml-4" />
      ))}
    </div>
  );
}
