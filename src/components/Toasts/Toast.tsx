import { Toast as ToastType } from "@/contexts/ToastContextProvider/toastReducer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { useToastContext } from "@/hooks/useToastContext";

const heading: Record<ToastType["type"], string> = {
  success: "Success",
  error: "Error",
};

const colors: Record<ToastType["type"], string> = {
  success:
    "bg-green-300 text-green-700 shadow-green-700/33 before:bg-green-700",
  error: "bg-red-300 text-red-700 shadow-red-700/33 before:bg-red-700",
};

export function Toast({ id, message, type }: ToastType) {
  const toast = useToastContext();

  function onDismiss() {
    toast?.remove(id);
  }

  return (
    <div
      className={`relative flex justify-between gap-2 overflow-hidden rounded-lg px-4 py-2 shadow-lg ${colors[type]} before:absolute before:left-0 before:top-0 before:h-full before:w-1.5`}
    >
      <div>
        <p className="font-bold">{heading[type]}</p>
        <p className="text-sm font-light">{message}</p>
      </div>
      <button onClick={onDismiss}>
        <FontAwesomeIcon icon={faClose} className={colors[type]} />
      </button>
    </div>
  );
}
