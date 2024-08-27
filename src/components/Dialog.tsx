import {
  DetailedHTMLProps,
  DialogHTMLAttributes,
  forwardRef,
  MouseEvent,
  useRef,
} from "react";
import { Button, ButtonProps } from "./Button";
import { mergeRefs } from "@/utils/mergeRefs";

interface DialogProps
  extends DetailedHTMLProps<
    DialogHTMLAttributes<HTMLDialogElement>,
    HTMLDialogElement
  > {
  heading: string;
  body: string;
  actions: {
    text: string;
    onClick: () => void;
    buttonType: ButtonProps["kind"];
  }[];
}

export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(
  function Dialog({ heading, body, actions, ...dialogProps }, forwardedRef) {
    const { onClick, ...props } = dialogProps;
    const thisRef = useRef<HTMLDialogElement>(null);
    const ref = mergeRefs(thisRef, forwardedRef);

    function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
      if (event.target === thisRef.current) {
        thisRef.current.close();
      }
      if (onClick) onClick(event);
    }

    return (
      <dialog
        {...props}
        ref={ref}
        onClick={onDialogClick}
        className={`rounded-xl border-0 p-0 backdrop:bg-background/75 ${dialogProps.className ?? ""}`.trim()}
      >
        <form
          method="dialog"
          className="max-w-xl rounded-xl border-2 border-foreground bg-background p-4 text-foreground"
        >
          <h3 className="text-2xl font-bold">{heading}</h3>
          <p className="mt-2">{body}</p>
          <div className="mt-4 flex gap-4">
            {actions.map(({ text, onClick, buttonType }) => (
              <Button key={text} onClick={onClick} kind={buttonType}>
                {text}
              </Button>
            ))}
          </div>
        </form>
      </dialog>
    );
  }
);
