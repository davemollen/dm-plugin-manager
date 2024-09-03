import { useContext } from "react";
import { PluginContext } from "../contexts/PluginContextProvider";

export const usePluginContext = () => useContext(PluginContext);
