import { useContext } from "react";
import { ToastContext } from "../contexts/ToastContextProvider";

export const useToast = () => useContext(ToastContext);
