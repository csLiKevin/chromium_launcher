import { existsSync, readdirSync } from "node:fs";

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
export function getLocalVersion(cacheDir: string): string | null {
  if (!existsSync(cacheDir)) {
    return null;
  }

  const manifestFileName = readdirSync(cacheDir).find((name) =>
    name.endsWith(".manifest"),
  );
  return manifestFileName ? manifestFileName.replace(/\.manifest$/, "") : null;
}
