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
import { waitForKeyPress } from "./src/pause.ts";
import { renderProgressBar } from "./src/progress.ts";
import { withSpinner } from "./src/spinner.ts";
import { verify } from "./src/verify.ts";
import { getLocalVersion, isUpToDate } from "./src/version.ts";

const REPOSITORY = "ungoogled-software/ungoogled-chromium-windows";
const CACHE_DIR = Bun.isStandaloneExecutable
  ? join(dirname(process.execPath), "bin")
  : join(import.meta.dir, "dist", "bin");

await mkdir(CACHE_DIR, { recursive: true });

const release = await withSpinner(
  "Checking for latest Chromium release...",
  () => getLatestRelease(REPOSITORY),
);
const asset = findPortableZip(release, getWindowsArch());
const zipPath = join(CACHE_DIR, asset.name);

const localVersion = await getLocalVersion(CACHE_DIR);
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
  extractZip(zipPath, CACHE_DIR),
);
console.log(`Unzipped ${asset.name}`);

console.log(`Deleting ${asset.name}...`);
await Bun.file(zipPath).delete();

if (Bun.isStandaloneExecutable) {
  process.stdout.write("Press any key to continue . . . ");
  await waitForKeyPress();
}
