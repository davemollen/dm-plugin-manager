import { Button } from "@/components/Button";

export function DisconnectedMod({
  reconnect,
  disabled,
  className,
}: {
  reconnect: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-sm">
        Make sure your MOD is hooked up via USB and try to reconnect.
        {` If it still doesn't connect, try to reboot your MOD and connect again.`}
      </p>
      <Button
        kind="secondary"
        onClick={reconnect}
        disabled={disabled}
        className="mt-4 h-auto px-3 py-2 text-sm"
      >
        Connect with MOD
      </Button>
    </div>
  );
}
