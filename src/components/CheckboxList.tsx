import { ChangeEvent, ReactNode, RefObject, useEffect, useRef } from "react";
import { Checkbox, CheckboxSkeleton } from "./Checkbox";

type Kind = "default" | "bordered";
const style: Record<Kind, string> = {
  default: "gap-2",
  bordered: "rounded-xl border border-panel overflow-hidden",
};
const checkAllStyle: Record<Kind, string> = {
  default: "gap-0",
  bordered: "bg-panel p-2",
};
const checkboxStyle: Record<Kind, string> = {
  default: "pl-4",
  bordered: "border-b border-panel p-2 pl-6 last:border-none",
};

export function CheckboxList<T extends string>({
  title,
  items,
  selectedItems,
  kind = "default",
  onChange,
  checkAllComponent,
  emptyComponent,
  disabled,
  className,
  checkAllClassName,
  checkboxClassName,
}: {
  title: string;
  items: T[];
  selectedItems?: T[];
  kind?: Kind;
  onChange: (selectedItems: T[]) => void;
  checkAllComponent?: (props: {
    ref: RefObject<HTMLInputElement>;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    items: T[];
  }) => ReactNode;
  emptyComponent?: ReactNode;
  disabled?: boolean;
  className?: string;
  checkAllClassName?: string;
  checkboxClassName?: string;
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
      onChange([...(selectedItems ?? []), value as T]);
    } else {
      onChange((selectedItems ?? []).filter((item) => item != value));
    }
  }

  useEffect(() => {
    function predicate(item: T) {
      return selectedItems?.includes(item);
    }

    if (ref.current) {
      ref.current.indeterminate = !items.every(predicate);
      ref.current.checked = items.some(predicate);
    }
  }, [selectedItems, ref]);

  return (
    <div className={`flex flex-col ${style[kind]} ${className ?? ""}`.trim()}>
      {checkAllComponent ? (
        checkAllComponent({
          ref,
          onChange: onCheckAll,
          disabled,
          items,
        })
      ) : (
        <Checkbox
          ref={ref}
          id={title}
          name={title}
          value={title}
          disabled={disabled}
          onChange={onCheckAll}
          className={`${checkAllStyle[kind]} ${checkAllClassName}`.trim()}
        />
      )}
      {items.map((item) => (
        <Checkbox
          key={item}
          id={item + title}
          name={title}
          value={item}
          onChange={onCheckboxChange}
          checked={selectedItems?.includes(item)}
          disabled={disabled}
          className={`${checkboxStyle[kind]} ${checkboxClassName}`.trim()}
        />
      ))}
      {items.length === 0 && emptyComponent}
    </div>
  );
}

export function CheckboxListSkeleton({
  count,
  enableCheckAll = true,
  kind = "default",
  className,
  checkAllClassName,
  checkboxClassName,
}: {
  count: number;
  enableCheckAll?: boolean;
  kind?: Kind;
  className?: string;
  checkAllClassName?: string;
  checkboxClassName?: string;
}) {
  return (
    <div className={`flex flex-col ${style[kind]} ${className ?? ""}`.trim()}>
      {enableCheckAll && (
        <CheckboxSkeleton
          className={`${checkAllStyle[kind]} ${checkAllClassName}`.trim()}
        />
      )}
      {[...Array(count).keys()].map((i) => (
        <CheckboxSkeleton
          key={i}
          className={`${checkboxStyle[kind]} ${checkboxClassName}`.trim()}
        />
      ))}
    </div>
  );
}
