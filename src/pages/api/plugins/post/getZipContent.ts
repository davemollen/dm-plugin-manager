import { CustomError } from "@/app/api/utils";
import JSZip from "jszip";
import { NextRequest } from "next/server";

export async function getZipContent(req: NextRequest) {
  const zip = new JSZip();

  const formData = await req.formData();
  const zipFile = formData.get("zipFile");
  if (!zipFile) {
    throw new CustomError("No files received.", 400);
  }

  const arrayBuffer = await (zipFile as File).arrayBuffer();
  return await zip.loadAsync(arrayBuffer);
}
