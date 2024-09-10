export function ProgressBar({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  return (
    <div
      className={`relative h-2 overflow-hidden rounded-full bg-panel ${className ?? ""}`.trim()}
    >
      <div
        className="absolute h-full bg-green-500 transition-all"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
