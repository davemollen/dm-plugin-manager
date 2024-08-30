import { createContext, ReactNode, useEffect, useReducer, useRef } from "react";
import { ActionType, toastReducer } from "./ToastContextProvider/toastReducer";
import { Toasts } from "../components/Toasts";

const TOAST_DISPLAY_TIME = 8000;

export const ToastContext = createContext<{
  success: (message: string) => void;
  error: (message: string) => void;
  remove: (id: string) => void;
} | null>(null);

export const ToastContextProvider = ({ children }: { children: ReactNode }) => {
  const timerRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [state, dispatch] = useReducer(toastReducer, {
    toasts: [],
  });

  function addToast(message: string, type: "success" | "error") {
    const id = Date.now().toString();

    dispatch({
      type: ActionType.ADD_TOAST,
      payload: { id, message, type },
    });

    timerRef.current[id] = setTimeout(() => {
      remove(id);
    }, TOAST_DISPLAY_TIME);
  }

  function success(message: string) {
    addToast(message, "success");
  }

  function error(message: string) {
    addToast(message, "error");
  }

  function remove(id: string) {
    dispatch({ type: ActionType.DELETE_TOAST, payload: id });
  }

  const value = { success, error, remove };

  useEffect(() => {
    () => {
      Object.values(timerRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      <Toasts toasts={state.toasts} />
      {children}
    </ToastContext.Provider>
  );
};
