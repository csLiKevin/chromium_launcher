import { EventEmitter } from "node:events";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { download } from "./src/download.ts";
import {
  findPortableZip,
  getLatestRelease,
  getWindowsArch,
} from "./src/github.ts";
import { renderProgressBar } from "./src/progress.ts";
import { verify } from "./src/verify.ts";

const REPOSITORY = "ungoogled-software/ungoogled-chromium-windows";
const CACHE_DIR = Bun.isStandaloneExecutable
  ? join(dirname(process.execPath), "bin")
  : join(import.meta.dir, "dist", "bin");

mkdirSync(CACHE_DIR, { recursive: true });

console.log("Checking for latest Chromium release...");
const release = await getLatestRelease(REPOSITORY);
const asset = findPortableZip(release, getWindowsArch());
const zipPath = join(CACHE_DIR, asset.name);

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
