export function parseVersionOutput(output: string): string | null {
  const match = output.match(/(\d+\.\d+\.\d+\.\d+)/);
  return match ? (match[1] ?? null) : null;
}

export function extractBaseVersion(tagName: string): string {
  return tagName.split("-")[0] ?? tagName;
}

export function isUpToDate(
  localVersion: string | null,
  latestTagName: string,
): boolean {
  return localVersion === extractBaseVersion(latestTagName);
}

export async function getLocalVersion(exePath: string): Promise<string | null> {
  if (!(await Bun.file(exePath).exists())) {
    return null;
  }

  const process = Bun.spawn([exePath, "--version"], { stdout: "pipe" });
  const output = await new Response(process.stdout).text();
  await process.exited;

  return parseVersionOutput(output);
}
