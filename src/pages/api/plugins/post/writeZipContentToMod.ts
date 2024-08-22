import path from "path";
import JSZip, { JSZipObject } from "jszip";
import { NodeSSH } from "node-ssh";
import { Readable } from "stream";
import { CustomError } from "../../utils";

export async function writeZipContentToMod(
  sshClient: NodeSSH,
  zipContent: JSZip,
  destinationFolder: string,
) {
  for (const [fileName, file] of Object.entries(zipContent.files)) {
    const filePath = path.join(destinationFolder, fileName);
    if (file.dir) {
      await createDirectory(sshClient, filePath);
    } else {
      await writeFile(sshClient, file, filePath);
    }
  }
}

async function createDirectory(sshClient: NodeSSH, filePath: string) {
  await sshClient.execCommand(`mkdir -p ${filePath}`);
}

async function writeFile(
  sshClient: NodeSSH,
  file: JSZipObject,
  filePath: string,
) {
  const fileBuffer = await file.async("nodebuffer");
  const fileStream = bufferToStream(fileBuffer);
  const { stderr } = await sshClient.execCommand(`cat > ${filePath}`, {
    stdin: fileStream,
  });
  if (stderr) {
    throw new CustomError(
      `Could not write file on MOD because of the following ssh command error:\n "${stderr}".`,
      403,
    );
  }
}

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Indicates the end of the stream
  return stream;
}
