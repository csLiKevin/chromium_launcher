export interface GithubAsset {
  name: string;
  browser_download_url: string;
  digest: string; // "sha256:<hex>"
}

export interface GithubRelease {
  tag_name: string;
  assets: GithubAsset[];
}

export function getWindowsArch(): "x64" | "arm64" | "x86" {
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

export async function getLatestRelease(repository: string): Promise<GithubRelease> {
  const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch latest release: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as GithubRelease;
}

export function findPortableZip(release: GithubRelease, architecture: string): GithubAsset {
  const suffix = `_windows_${architecture}.zip`;
  const asset = release.assets.find((a) => a.name.endsWith(suffix));
  if (!asset) {
    throw new Error(`No "${suffix}" asset found in release ${release.tag_name}`);
  }
  return asset;
}
