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
import { resolveSettingsPath } from "./src/paths.ts";
import { waitForKeyPress } from "./src/pause.ts";
import { renderProgressBar } from "./src/progress.ts";
import {
  getUpdateCheckSkipReason,
  readSettings,
  writeSettings,
} from "./src/settings.ts";
import { withSpinner } from "./src/spinner.ts";
import { verify } from "./src/verify.ts";
import { getLocalVersion, isUpToDate } from "./src/version.ts";

const REPOSITORY = "ungoogled-software/ungoogled-chromium-windows";
const LAUNCHER_DIR = Bun.isStandaloneExecutable
  ? dirname(process.execPath)
  : join(import.meta.dir, "dist");

const SETTINGS_PATH = join(LAUNCHER_DIR, "settings.json");

const settings = await readSettings(SETTINGS_PATH);

const CHROMIUM_DIR = resolveSettingsPath(
  settings.chromiumDirectory,
  LAUNCHER_DIR,
);
const USER_DATA_DIR = resolveSettingsPath(
  settings.userDataDirectory,
  LAUNCHER_DIR,
);

await mkdir(CHROMIUM_DIR, { recursive: true });
await mkdir(USER_DATA_DIR, { recursive: true });
const skipReason = getUpdateCheckSkipReason(
  settings.lastUpdateCheck,
  settings.chromiumCheckPeriod,
);

if (skipReason) {
  console.log(`Skipping update check (${skipReason}).`);
} else {
  const release = await withSpinner(
    "Checking for latest Chromium release...",
    () => getLatestRelease(REPOSITORY),
  );
  await writeSettings(SETTINGS_PATH, {
    ...settings,
    lastUpdateCheck: new Date().toISOString(),
  });
  const asset = findPortableZip(release, getWindowsArch());
  const zipPath = join(CHROMIUM_DIR, asset.name);

  const localVersion = await getLocalVersion(CHROMIUM_DIR);
  if (isUpToDate(localVersion, release.tag_name)) {
    console.log(`Chrome is up to date (${release.tag_name}).`);
  } else {
    console.log(
      `Chrome is out of date (have ${localVersion ?? "none"}, latest ${release.tag_name}).`,
    );
  }

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
    extractZip(zipPath, CHROMIUM_DIR),
  );
  console.log(`Unzipped ${asset.name}`);

  console.log(`Deleting ${asset.name}...`);
  await Bun.file(zipPath).delete();
  console.log(`Deleted ${asset.name}`);
}

if (Bun.isStandaloneExecutable) {
  process.stdout.write("Press any key to continue . . . ");
  await waitForKeyPress();
}
