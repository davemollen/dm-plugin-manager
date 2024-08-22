import { CustomError } from "@/app/api/utils";
import { NodeSSH } from "node-ssh";

export async function deletePlugin(
  sshClient: NodeSSH,
  pluginName: string,
): Promise<string[]> {
  const { stdout, stderr } = await sshClient.execCommand(
    `rm -rf ${process.env.LV2_FOLDER_PATH}/${pluginName}`,
  );
  if (stderr) {
    throw new CustomError(
      `Could not delete the plugin because of the following ssh command error:\n "${stderr}".`,
      500,
    );
  }
  return stdout.split("\n");
}
