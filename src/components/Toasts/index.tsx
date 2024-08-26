import { Toast as ToastType } from "@/contexts/ToastContextProvider/toastReducer";
import { Toast } from "./Toast";

export function Toasts({ toasts }: { toasts: ToastType[] }) {
  return (
    <div className="sticky top-4 w-0 float-right z-20">
      <div className="absolute top-0 right-0 flex w-64 flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  );
}
