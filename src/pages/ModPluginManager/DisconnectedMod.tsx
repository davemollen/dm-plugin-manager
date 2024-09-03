import { Button } from "../../components/Button";

export function DisconnectedMod({ reconnect }: { reconnect: () => void }) {
  return (
    <div className="text-sm">
      <h3 className="font-sans text-2xl font-bold tracking-wide">
        Unable to connect with MOD.
      </h3>
      <p className="mt-2 max-w-lg">
        Make sure your MOD is hooked up via USB and try to reconnect. If it
        still doesn't connect, try to reboot your MOD and connect again.
      </p>
      <Button className="mt-8" onClick={reconnect}>
        Connect with MOD
      </Button>
    </div>
  );
}
