import { CustomError } from "@/app/api/utils";
import { NodeSSH } from "node-ssh";

export async function getListOfPlugins(sshClient: NodeSSH): Promise<string[]> {
  const { stdout, stderr } = await sshClient.execCommand(
    `cd ${process.env.LV2_FOLDER_PATH} && ls`,
  );
  if (stderr) {
    throw new CustomError(
      `Could not get the list of plugins because of the following ssh command error:\n "${stderr}".`,
      500,
    );
  }
  return stdout.split("\n");
}
