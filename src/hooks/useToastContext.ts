import { useContext } from "react";
import { ToastContext } from "../contexts/ToastContextProvider";

export const useToastContext = () => useContext(ToastContext);
