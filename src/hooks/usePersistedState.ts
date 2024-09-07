import { useState } from "react";

function getDefaultValue<T extends any>(key: string, defaultValue: T) {
    const stringifiedValue = localStorage.getItem(key);
    return stringifiedValue ? JSON.parse(stringifiedValue) : defaultValue;
}

export function usePersistedState<T extends any>(key: string, defaultValue: T): [T, (value: T) => void] {
    const [state, setState] = useState<T>(getDefaultValue(key, defaultValue));

    function dispatch(value: T) {
        localStorage.setItem(key, JSON.stringify(value));
        setState(value);
    }

    return [state, dispatch];
}