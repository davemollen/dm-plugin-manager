import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { Dialog } from "@/components/Dialog";
import { useRef } from "react";

export function Plugin({
  name,
  onRemove,
}: {
  name: string;
  onRemove: (name: string) => void;
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
        className="flex h-12 w-full items-center justify-between rounded-xl border-2 border-white px-2 py-1 text-lg"
      >
        {name}
        <button onClick={onButtonClick}>
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
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
