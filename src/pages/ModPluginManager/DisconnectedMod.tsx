import { Button } from "../../components/Button";

export function DisconnectedMod({ getPlugins }: { getPlugins: () => void }) {
  return (
    <div>
      <h3 className="text-3xl tracking-wide font-bold">
        Unable to connect with MOD.
      </h3>
      <p className="mt-2">
        Make sure your MOD is hooked up via USB and try to reconnect.
        <br />
        {`If it still doesn't connect, try to reboot your MOD and connect again.`}
      </p>
      <Button className="mt-8" onClick={getPlugins}>
        Connect with MOD
      </Button>
    </div>
  );
}
