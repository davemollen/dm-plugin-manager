import { NodeSSH } from "node-ssh";
import { CustomError } from "../utils";

export async function createSshClient() {
  const ssh = new NodeSSH();

  try {
    const sshClient = await ssh.connect({
      host: process.env.SSH_HOST,
      username: process.env.SSH_USERNAME,
      password: process.env.SSH_PASSWORD,
      readyTimeout: 4000,
    });
    if (!sshClient.isConnected()) {
      throw null;
    }

    return sshClient;
  } catch (e) {
    throw new CustomError("Unable to connect with MOD device.", 503);
  }
}
