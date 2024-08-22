import { NextRequest, NextResponse } from "next/server";
import { getListOfPlugins } from "./get/getListOfPlugins";
import { createSshClient } from "./sshClient";
import { writeZipContentToMod } from "./post/writeZipContentToMod";
import { CustomError } from "../utils";
import { getZipContent } from "./post/getZipContent";
import { NodeSSH } from "node-ssh";
import { CreatePluginsResponse, GetPluginsResponse } from "./post/interfaces";
import { extractPluginNamesFromZip } from "./post/extractPluginNamesFromZipPluginNamesFromZip";
import { deletePlugin } from "./delete/deletePlugin";

async function GET() {
  let sshClient: NodeSSH | null = null;

  try {
    if (!process.env.LV2_FOLDER_PATH || !process.env.SSH_HOST || !process.env.SSH_USERNAME || !process.env.SSH_PASSWORD) {
      return NextResponse.json("One or more environment variables are missing.", {
        status: 500,
      });
    }

    sshClient = await createSshClient();
    const plugins = await getListOfPlugins(sshClient);

    return NextResponse.json<GetPluginsResponse>({ plugins }, { status: 200 });
  } catch (e) {
    return e instanceof CustomError
      ? NextResponse.json(e.message, { status: e.statusCode })
      : NextResponse.json(e, { status: 500 });
  } finally {
    if (sshClient) {
      sshClient.dispose();
    }
  }
}

async function POST(req: NextRequest) {
  let sshClient: NodeSSH | null = null;

  try {
    if (!process.env.LV2_FOLDER_PATH || !process.env.SSH_HOST || !process.env.SSH_USERNAME || !process.env.SSH_PASSWORD) {
      return NextResponse.json("One or more environment variables are missing.", {
        status: 500,
      });
    }

    sshClient = await createSshClient();
    const zipContent = await getZipContent(req);
    const pluginNames = extractPluginNamesFromZip(zipContent);
    await writeZipContentToMod(
      sshClient,
      zipContent,
      process.env.LV2_FOLDER_PATH,
    );

    return NextResponse.json<CreatePluginsResponse>(
      {
        plugins: pluginNames,
      },
      { status: 200 },
    );
  } catch (e) {
    return e instanceof CustomError
      ? NextResponse.json(e.message, { status: e.statusCode })
      : NextResponse.json(e, { status: 500 });
  } finally {
    if (sshClient) {
      sshClient.dispose();
    }
  }
}

async function DELETE(req: NextRequest) {
  let sshClient: NodeSSH | null = null;

  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json(
        `Request is missing the "name" body parameter.`,
        { status: 500 },
      );
    }
    if (!process.env.LV2_FOLDER_PATH || !process.env.SSH_HOST || !process.env.SSH_USERNAME || !process.env.SSH_PASSWORD) {
      return NextResponse.json("One or more environment variables are missing.", {
        status: 500,
      });
    }

    sshClient = await createSshClient();
    await deletePlugin(sshClient, name);

    return NextResponse.json("Successfully deleted plugin.", { status: 200 });
  } catch (e) {
    return e instanceof CustomError
      ? NextResponse.json(e.message, { status: e.statusCode })
      : NextResponse.json(e, { status: 500 });
  } finally {
    if (sshClient) {
      sshClient.dispose();
    }
  }
}

export { GET, POST, DELETE };
