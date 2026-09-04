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
    // Without this, Chrome can be torn down along with the launcher's
    // process group instead of surviving on its own (UV_PROCESS_DETACHED on Windows).
    detached: true,
  });
  // Hand off to Chrome and exit immediately rather than keeping the launcher
  // (and its console window) open until Chrome itself closes.
  process.unref();
}
