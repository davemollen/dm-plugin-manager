import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { Dialog } from "@/components/Dialog";
import { useRef } from "react";
import { faSpinner } from "@fortawesome/free-solid-svg-icons/faSpinner";

export function Plugin({
  name,
  canBeRemoved = true,
  onRemove,
  isRemoving,
  className,
}: {
  name: string;
  canBeRemoved?: boolean;
  onRemove: (name: string) => void;
  isRemoving: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  function onButtonClick() {
    ref.current?.showModal();
  }

  function onAbort() {
    if (ref.current) ref.current.close();
  }

  function onConfirm() {
    onRemove(name);
    if (ref.current) ref.current.close();
  }

  return (
    <>
      <li
        key={name}
        className={`flex h-12 w-full items-center justify-between rounded-xl border-2 border-foreground px-2 py-1 text-lg ${className ?? ""}`.trim()}
      >
        <span className="truncate">{name}</span>
        {canBeRemoved && (
          <button onClick={onButtonClick}>
            {isRemoving ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faTrashCan} className="hover:text-link" />
            )}
          </button>
        )}
      </li>
      <Dialog
        ref={ref}
        heading="Remove plugin"
        body={`Are you sure you want to remove "${name}" from your MOD? This action can not be undone.`}
        actions={[
          {
            text: "Cancel",
            onClick: onAbort,
            buttonType: "secondary",
          },
          {
            text: "Remove plugin",
            onClick: onConfirm,
            buttonType: "primary",
          },
        ]}
      />
    </>
  );
}
