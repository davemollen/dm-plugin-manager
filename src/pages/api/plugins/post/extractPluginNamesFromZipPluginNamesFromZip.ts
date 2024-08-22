import JSZip from "jszip";

export function extractPluginNamesFromZip(zipContent: JSZip) {
  return Object.keys(zipContent.files).reduce<string[]>((names, filePath) => {
    const lv2FolderName = filePath
      .replace(/^\//, "")
      .replace(/(?<=.lv2).*/, "");
    if (!names.includes(lv2FolderName)) {
      names.push(lv2FolderName);
    }

    return names;
  }, []);
}
