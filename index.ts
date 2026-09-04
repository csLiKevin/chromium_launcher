import { EventEmitter } from "node:events";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { download } from "./src/download.ts";
import { extractZip } from "./src/extract.ts";
import {
  findPortableZip,
  getLatestRelease,
  getWindowsArch,
} from "./src/github.ts";
import { buildChromeArgs, launchChrome } from "./src/launch.ts";
import { resolveSettingsPath } from "./src/paths.ts";
import { waitForKeyPress } from "./src/pause.ts";
import { renderProgressBar } from "./src/progress.ts";
import {
  getUpdateCheckSkipReason,
  readSettings,
  type Settings,
  writeSettings,
} from "./src/settings.ts";
import { withSpinner } from "./src/spinner.ts";
import { verify } from "./src/verify.ts";
import { getLocalVersion, isUpToDate } from "./src/version.ts";

const REPOSITORY = "ungoogled-software/ungoogled-chromium-windows";

async function checkForUpdate(
  settingsPath: string,
  settings: Settings,
  chromiumDir: string,
): Promise<void> {
  const release = await withSpinner(
    "Checking for latest Chromium release...",
    () => getLatestRelease(REPOSITORY),
  );
  await writeSettings(settingsPath, {
    ...settings,
    lastUpdateCheck: new Date().toISOString(),
  });

  const localVersion = await getLocalVersion(chromiumDir);
  if (isUpToDate(localVersion, release.tag_name)) {
    console.log(`Chrome is up to date (${release.tag_name}).`);
    return;
  }
  console.log(
    `Chrome is out of date (have ${localVersion ?? "none"}, latest ${release.tag_name}).`,
  );

  const asset = findPortableZip(release, getWindowsArch());
  const zipPath = join(chromiumDir, asset.name);

  const emitter = new EventEmitter();
  emitter.on("progress", (downloaded: number, total: number) => {
    process.stdout.write(`\r${renderProgressBar(downloaded, total)}`);
  });

  console.log(`Downloading ${asset.name}...`);
  await download(asset.browser_download_url, zipPath, emitter);
  process.stdout.write("\n");

  console.log("Verifying checksum...");
  const expectedHash = asset.digest.replace(/^sha256:/, "");
  await verify(zipPath, expectedHash);
  console.log(`Verified ${asset.name}`);

  await withSpinner(`Unzipping ${asset.name}...`, () =>
    extractZip(zipPath, chromiumDir),
  );
  console.log(`Unzipped ${asset.name}`);

  console.log(`Deleting ${asset.name}...`);
  await Bun.file(zipPath).delete();
  console.log(`Deleted ${asset.name}`);
}

async function launchIfPossible(
  exePath: string,
  chromiumDir: string,
  chromiumCommandLine: string,
): Promise<void> {
  const canLaunch = await Bun.file(exePath).exists();

  process.stdout.write(
    canLaunch
      ? "Press any key to start Chromium . . . "
      : "Press any key to exit . . . ",
  );
  await waitForKeyPress();

  if (canLaunch) {
    launchChrome(exePath, buildChromeArgs(chromiumCommandLine), chromiumDir);
  } else {
    console.log("No local Chromium build was found.");
  }
}

const LAUNCHER_DIR = Bun.isStandaloneExecutable
  ? dirname(process.execPath)
  : join(import.meta.dir, "dist");
const SETTINGS_PATH = join(LAUNCHER_DIR, "settings.json");

const settings = await readSettings(SETTINGS_PATH);
console.log("Settings:");
console.log(
  JSON.stringify(settings, null, 2)
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n"),
);

const CHROMIUM_DIR = resolveSettingsPath(
  settings.chromiumDirectory,
  LAUNCHER_DIR,
);
const EXE_PATH = join(CHROMIUM_DIR, "chrome.exe");

await mkdir(CHROMIUM_DIR, { recursive: true });

const skipReason = getUpdateCheckSkipReason(
  settings.lastUpdateCheck,
  settings.chromiumCheckPeriod,
);

if (skipReason) {
  console.log(`Skipping update check (${skipReason}).`);
} else {
  try {
    await checkForUpdate(SETTINGS_PATH, settings, CHROMIUM_DIR);
  } catch (error) {
    console.error(
      `Update check failed: ${(error as Error).message}. Launching the existing local build if available.`,
    );
  }
}

await launchIfPossible(EXE_PATH, CHROMIUM_DIR, settings.chromiumCommandLine);
