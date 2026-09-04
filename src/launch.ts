export function buildChromeArgs(chromiumCommandLine: string): string[] {
  return chromiumCommandLine.split(/\s+/).filter(Boolean);
}

export function launchChrome(
  exePath: string,
  args: string[],
  cwd: string,
): void {
  Bun.spawn([exePath, ...args], {
    cwd,
    stdio: ["ignore", "ignore", "ignore"],
  });
}
