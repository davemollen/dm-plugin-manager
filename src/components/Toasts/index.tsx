import { Toast as ToastType } from "@/contexts/ToastContextProvider/toastReducer";
import { Toast } from "./Toast";

export function Toasts({ toasts }: { toasts: ToastType[] }) {
  return (
    <div className="sticky top-4 z-20 float-right flex w-64 flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
