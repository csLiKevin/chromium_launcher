export function buildChromeArgs(chromiumCommandLine: string): string[] {
  return chromiumCommandLine.split(/\s+/).filter(Boolean);
}

export function launchChrome(
  exePath: string,
  args: string[],
  cwd: string,
): void {
  const process = Bun.spawn([exePath, ...args], {
    cwd,
    stdio: ["ignore", "ignore", "ignore"],
  });
  // Hand off to Chrome and exit immediately rather than keeping the launcher
  // (and its console window) open until Chrome itself closes.
  process.unref();
}
