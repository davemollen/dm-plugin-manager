import { Reducer } from "react";

export type Toast = {
  id: string;
  message: string;
  type: "success" | "error";
};

type State = {
  toasts: Toast[];
};

export enum ActionType {
  "ADD_TOAST",
  "DELETE_TOAST",
  "DELETE_OLDEST_TOAST",
}

type Action =
  | {
      type: ActionType.ADD_TOAST;
      payload: Toast;
    }
  | {
      type: ActionType.DELETE_TOAST;
      payload: string;
    };

export const toastReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    case ActionType.DELETE_TOAST:
      const updatedToasts = state.toasts.filter(
        (toast) => toast.id !== action.payload,
      );
      return {
        ...state,
        toasts: updatedToasts,
      };
    default:
      throw new Error(`Unknown action.`);
  }
};
