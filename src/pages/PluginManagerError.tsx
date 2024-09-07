import { Button } from "@/components/Button";
import { usePluginContext } from "@/hooks/usePluginContext";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation, useNavigate } from "react-router-dom";

export function PluginManagerError() {
  const { mode } = usePluginContext();
  const navigate = useNavigate();
  const { state }: { state: { error: string } } = useLocation();

  function goBackClick() {
    navigate(-1);
  }

  function fromStartClick() {
    navigate("/");
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <FontAwesomeIcon
        icon={faTriangleExclamation}
        size="3x"
        className="text-red-500"
      />
      <h2 className="w-64 font-sans text-3xl font-bold">{mode} failed</h2>
      <p className="max-w-sm text-sm">
        Unfortunately, one or more plugins could not be{" "}
        {mode === "Install" ? "installed" : "uninstalled"}. Because the
        following error occurred: "{state.error}". Please try again by going
        back to the previous page. Or {mode.toLowerCase()} again from the start.
      </p>
      <div className="mt-4 flex gap-2">
        <Button onClick={goBackClick} kind="secondary">
          Go back
        </Button>
        <Button onClick={fromStartClick}>From the start</Button>
      </div>
    </div>
  );
}
