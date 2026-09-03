import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { zipSync } from "fflate";
import { extractZip, stripLeadingDirectory } from "../src/extract.ts";

const TEMP_DIR = join(import.meta.dir, "..", "dist", "test_tmp");

afterEach(() => {
  rmSync(TEMP_DIR, { recursive: true, force: true });
});

async function writeZip(
  name: string,
  files: Record<string, string>,
): Promise<string> {
  mkdirSync(TEMP_DIR, { recursive: true });
  const entries: Record<string, Uint8Array> = {};
  for (const [entryName, content] of Object.entries(files)) {
    entries[entryName] = new TextEncoder().encode(content);
  }
  const path = join(TEMP_DIR, name);
  await Bun.write(path, zipSync(entries));
  return path;
}

describe("stripLeadingDirectory", () => {
  it("strips the first path segment", () => {
    expect(stripLeadingDirectory("chromium-151.0_windows_x64/chrome.exe")).toBe(
      "chrome.exe",
    );
  });

  it("strips only the first segment when there are multiple", () => {
    expect(
      stripLeadingDirectory("chromium-151.0_windows_x64/locales/en-US.pak"),
    ).toBe("locales/en-US.pak");
  });

  it("returns the name unchanged when there is no directory", () => {
    expect(stripLeadingDirectory("chrome.exe")).toBe("chrome.exe");
  });
});

describe("extractZip", () => {
  it("strips the wrapping top-level folder from extracted files", async () => {
    const zipPath = await writeZip("flat.zip", {
      "ungoogled-chromium_151.0_windows_x64/chrome.exe": "fake exe contents",
    });
    const destinationDir = join(TEMP_DIR, "flat_out");

    await extractZip(zipPath, destinationDir);

    expect(await Bun.file(join(destinationDir, "chrome.exe")).text()).toBe(
      "fake exe contents",
    );
  });

  it("extracts nested files under the wrapping folder, creating directories as needed", async () => {
    const zipPath = await writeZip("nested.zip", {
      "ungoogled-chromium_151.0_windows_x64/locales/en-US.pak": "locale data",
    });
    const destinationDir = join(TEMP_DIR, "nested_out");

    await extractZip(zipPath, destinationDir);

    expect(
      await Bun.file(join(destinationDir, "locales", "en-US.pak")).text(),
    ).toBe("locale data");
  });
});
