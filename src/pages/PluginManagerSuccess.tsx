import { Button } from "@/components/Button";
import { usePluginContext } from "@/hooks/usePluginContext";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

export function PluginManagerSuccess() {
  const { mode } = usePluginContext();
  const navigate = useNavigate();

  function onClick() {
    navigate("/");
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <FontAwesomeIcon
        icon={faCircleCheck}
        size="4x"
        className="text-green-500"
      />
      <h2 className="w-64 font-sans text-3xl font-bold">
        Successfully {mode === "Install" ? "installed" : "uninstalled"} plugins
      </h2>
      <p className="max-w-sm">
        You can close this application or install more plugins.
      </p>
      <Button onClick={onClick} className="mt-4">
        Install more plugins
      </Button>
    </div>
  );
}
