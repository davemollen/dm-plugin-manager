import { Button } from "@/components/Button";

export function DisconnectedMod({ reconnect }: { reconnect: () => void }) {
  return (
    <div className="ml-4 mt-4">
      <p className="mt-2 text-sm">
        Make sure your MOD is hooked up via USB and try to reconnect.
        {` If it still doesn't connect, try to reboot your MOD and connect again.`}
      </p>
      <Button
        kind="secondary"
        onClick={reconnect}
        className="mt-4 h-auto px-3 py-2 text-sm"
      >
        Connect with MOD
      </Button>
    </div>
  );
}
