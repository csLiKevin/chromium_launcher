import { readdir } from "node:fs/promises";

export function extractBaseVersion(tagName: string): string {
  return tagName.split("-")[0] ?? tagName;
}

export function isUpToDate(
  localVersion: string | null,
  latestTagName: string,
): boolean {
  return localVersion === extractBaseVersion(latestTagName);
}

// The extracted build includes a "<version>.manifest" file; its name encodes
// the version, so it can be read directly without executing chrome.exe.
export async function getLocalVersion(
  chromiumDir: string,
): Promise<string | null> {
  let entries: string[];
  try {
    entries = await readdir(chromiumDir);
  } catch {
    return null;
  }

  const manifestFileName = entries.find((name) => name.endsWith(".manifest"));
  return manifestFileName ? manifestFileName.replace(/\.manifest$/, "") : null;
}
