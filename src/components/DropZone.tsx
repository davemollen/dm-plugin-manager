import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, DragEvent, KeyboardEvent, useRef, useState } from "react";

export interface DropZoneFile extends File {
  path?: string;
}

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}

export function DropZone({
  onChange,
  allowedFileTypes,
  isLoading,
  disabled,
  className,
}: {
  onChange: (files: DropZoneFile[]) => void;
  allowedFileTypes?: string[];
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    e.preventDefault();

    const { files } = e.target;
    if (files) {
      try {
        validateFolderName(files);
        onChange(Array.from(files) as DropZoneFile[]);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    }
  }

  function validateFolderName(files: FileList) {
    if (allowedFileTypes) {
      const folderName = files[0].webkitRelativePath.split("/")[0];

      if (!allowedFileTypes.some((fileType) => folderName.endsWith(fileType))) {
        throw new Error(
          `Only the following file types are allowed: "${allowedFileTypes.join(
            ",",
          )}".`,
        );
      }
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setError(null);
    setIsDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    try {
      const files = await getAllFileEntries(e.dataTransfer.items);
      onChange(files);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
  };

  async function getAllFileEntries(dataTransferItemList: DataTransferItemList) {
    const files: DropZoneFile[] = [];
    const fileSystemEntries = Array.from(dataTransferItemList).map((item) =>
      item.webkitGetAsEntry(),
    );

    if (fileSystemEntries.some((entry) => !entry?.isDirectory)) {
      throw new Error("Select folders instead of files please.");
    }
    if (
      allowedFileTypes &&
      !fileSystemEntries.every((entry) =>
        allowedFileTypes.some((fileType) => entry?.name.endsWith(fileType)),
      )
    ) {
      throw new Error(
        `Only the following file types are allowed: "${allowedFileTypes.join(
          ",",
        )}".`,
      );
    }
    await readFileSystemEntries(fileSystemEntries, files);

    return files;
  }

  async function readFileSystemEntries(
    fileSystemEntries: (FileSystemEntry | null)[],
    files: DropZoneFile[],
  ) {
    await Promise.all(
      fileSystemEntries.map(async (entry) => {
        if (entry?.isDirectory) {
          const fileSystemEntries = await readDirectory(
            entry as FileSystemDirectoryEntry,
          );
          await readFileSystemEntries(fileSystemEntries, files);
        }
        if (entry?.isFile) {
          const file = await readFile(entry as FileSystemFileEntry);
          files.push(file);
        }
      }),
    );
  }

  async function readFile(entry: FileSystemFileEntry) {
    return new Promise<DropZoneFile>((resolve, _) => {
      entry.file(async (file) => {
        const rawFile = file as DropZoneFile;
        rawFile.path = entry.fullPath;
        resolve(rawFile);
      });
    });
  }

  async function readDirectory(entry: FileSystemDirectoryEntry) {
    const reader = entry.createReader();
    return await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
  }

  function onClick() {
    inputRef.current?.click();
    setError(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.code === "Enter") {
      onClick();
    }
  }

  return (
    <form>
      <div
        role="button"
        aria-label="dropzone"
        tabIndex={0}
        className={`relative flex min-h-32 flex-col items-center justify-center border-2 border-dashed p-4 text-center ${
          !!error
            ? "border-red-600 text-red-600"
            : isDragging && !disabled
              ? "border-blue-400 text-link"
              : "border-foreground text-foreground"
        } ${disabled ? "cursor-default opacity-50" : "cursor-pointer opacity-100 hover:border-blue-400 hover:text-link"} ${className ?? ""}`.trim()}
        onSubmit={(e) => e.preventDefault()}
        onDrop={onDrop}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        <input
          webkitdirectory=""
          placeholder="fileInput"
          ref={inputRef}
          type="file"
          multiple={true}
          disabled={disabled}
          onChange={onFileChange}
          className="hidden"
        />
        {isLoading ? (
          <FontAwesomeIcon
            icon={faSpinner}
            size="2xl"
            className="animate-spin"
          />
        ) : (
          <p>
            Add new plugins by dragging your files here or by clicking in this
            area.
          </p>
        )}
      </div>
      {!!error && <p className="mt-2 text-red-600">{error}</p>}
    </form>
  );
}
