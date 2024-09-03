import { open } from "@tauri-apps/plugin-dialog";
import { DetailedHTMLProps, InputHTMLAttributes } from "react";

interface FolderInputProps
  extends Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    "type" | "onChange" | "directory"
  > {
  label: string;
  value: string;
  onChange: (name: string, folderPath: string) => void;
}

export function FolderInput({
  id,
  label,
  name,
  value,
  className,
  onChange,
  ...props
}: FolderInputProps) {
  async function onClick() {
    const result = await open({
      multiple: false,
      directory: true,
    });

    if (name && result) {
      onChange(name, result);
    }
  }

  return (
    <div
      role="button"
      aria-label="folder picker"
      className={`group flex cursor-pointer items-center self-start overflow-hidden rounded-lg border border-gray-300 bg-gray-50 font-sans text-sm dark:border-gray-500 dark:bg-gray-500 ${className ?? ""}`.trim()}
      onClick={onClick}
    >
      <p className="bg-gray-200 py-1 pl-2 pr-1 font-semibold group-hover:bg-gray-400 dark:bg-gray-700 dark:group-hover:bg-gray-600">
        {label}
      </p>
      <label
        htmlFor={id}
        className="cursor-pointer truncate px-2 py-1 font-light"
      >
        {value}
      </label>
      <input {...props} type="file" className="hidden" />
    </div>
  );
}
