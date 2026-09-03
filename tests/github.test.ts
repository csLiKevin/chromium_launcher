import { describe, it, expect } from "bun:test";
import { findPortableZip, getWindowsArch, type GithubRelease } from "../src/github.ts";

const mockRelease: GithubRelease = {
  tag_name: "128.0.6613.138-1.1",
  assets: [
    {
      name: "ungoogled-chromium_128.0.6613.138-1.1_windows_x64.zip",
      browser_download_url: "https://example.com/x64.zip",
      digest: "sha256:abc123",
    },
    {
      name: "ungoogled-chromium_128.0.6613.138-1.1_windows_arm64.zip",
      browser_download_url: "https://example.com/arm64.zip",
      digest: "sha256:def456",
    },
  ],
};

describe("findPortableZip", () => {
  it("finds the correct asset for x64", () => {
    const asset = findPortableZip(mockRelease, "x64");
    expect(asset.name).toContain("_windows_x64.zip");
  });

  it("finds the correct asset for arm64", () => {
    const asset = findPortableZip(mockRelease, "arm64");
    expect(asset.name).toContain("_windows_arm64.zip");
  });

  it("throws when no matching asset exists", () => {
    expect(() => findPortableZip(mockRelease, "x86")).toThrow(
      /No ".*" asset found in release/
    );
  });
});

describe("getWindowsArch", () => {
  it("returns a valid architecture string for the current platform", () => {
    const validArchitectures = ["x64", "arm64", "x86"];
    // Will throw on unsupported architecture, which is also correct behavior.
    try {
      const architecture = getWindowsArch();
      expect(validArchitectures).toContain(architecture);
    } catch (error) {
      expect((error as Error).message).toContain("Unsupported architecture");
    }
  });
});
