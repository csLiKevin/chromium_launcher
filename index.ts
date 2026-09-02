import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const REPO = "ungoogled-software/ungoogled-chromium-windows";
const CACHE_DIR = Bun.isStandaloneExecutable
  ? join(dirname(process.execPath), "bin")       // compiled: dist/chromium_launcher.exe -> dist/bin
  : join(import.meta.dir, "dist", "bin");        // dev: index.ts -> dist/bin

interface GithubAsset {
  name: string;
  browser_download_url: string;
  digest: string; // "sha256:<hex>"
}

interface GithubRelease {
  tag_name: string;
  assets: GithubAsset[];
}

function getWindowsArch(): "x64" | "arm64" | "x86" {
  switch (process.arch) {
    case "x64":
      return "x64";
    case "arm64":
      return "arm64";
    case "ia32":
      return "x86";
    default:
      throw new Error(`Unsupported architecture for ungoogled-chromium: ${process.arch}`);
  }
}

async function getLatestRelease(): Promise<GithubRelease> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch latest release: ${res.status} ${res.statusText}`);
  }
  return(await res.json()) as GithubRelease;
}

function findPortableZip(release: GithubRelease, arch: string): GithubAsset {
  const suffix = `_windows_${arch}.zip`;
  const asset = release.assets.find((a) => a.name.endsWith(suffix));
  if (!asset) {
    throw new Error(`No "${suffix}" asset found in release ${release.tag_name}`);
  }
  return asset;
}

async function downloadAndVerify(asset: GithubAsset, destZip: string): Promise<void> {
  const res = await fetch(asset.browser_download_url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${asset.name}: ${res.status} ${res.statusText}`);
  }

  console.log(`Downloading ${asset.name}...`);
  const file = Bun.file(destZip);
  const fileWriter = file.writer();
  for await (const chunk of res.body) {
    fileWriter.write(chunk);
  }
  await fileWriter.end();

  const expected = asset.digest.replace(/^sha256:/, "");
  const actual = new Bun.CryptoHasher("sha256").update(await Bun.file(destZip).arrayBuffer()).digest("hex");

  if (actual !== expected) {
    await Bun.file(destZip).delete();
    throw new Error(`Checksum mismatch for ${asset.name}: expected ${expected}, got ${actual}`);
  }

  console.log(`Verified ${asset.name} (sha256:${actual})`);
}

mkdirSync(CACHE_DIR, { recursive: true });

const release = await getLatestRelease();
const asset = findPortableZip(release, getWindowsArch());
const zipPath = join(CACHE_DIR, asset.name);

await downloadAndVerify(asset, zipPath);
