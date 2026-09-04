import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  extractBaseVersion,
  getLocalVersion,
  isUpToDate,
} from "../src/version.ts";

const TEMP_DIR = join(import.meta.dir, "..", "dist", "test_tmp");

afterEach(() => {
  rmSync(TEMP_DIR, { recursive: true, force: true });
});

describe("extractBaseVersion", () => {
  it("strips the ungoogled-chromium release suffix", () => {
    expect(extractBaseVersion("128.0.6613.138-1.1")).toBe("128.0.6613.138");
  });

  it("returns the tag unchanged when there is no suffix", () => {
    expect(extractBaseVersion("128.0.6613.138")).toBe("128.0.6613.138");
  });
});

describe("isUpToDate", () => {
  it("is true when the local version matches the latest release", () => {
    expect(isUpToDate("128.0.6613.138", "128.0.6613.138-1.1")).toBe(true);
  });

  it("is false when the local version differs from the latest release", () => {
    expect(isUpToDate("127.0.6533.99", "128.0.6613.138-1.1")).toBe(false);
  });

  it("is false when there is no local version", () => {
    expect(isUpToDate(null, "128.0.6613.138-1.1")).toBe(false);
  });
});

describe("getLocalVersion", () => {
  it("returns null when the cache directory does not exist", () => {
    const missingDir = join(TEMP_DIR, "does_not_exist");
    expect(getLocalVersion(missingDir)).toBeNull();
  });

  it("returns null when no manifest file is present", () => {
    mkdirSync(TEMP_DIR, { recursive: true });
    expect(getLocalVersion(TEMP_DIR)).toBeNull();
  });

  it("reads the version from the manifest file's name", () => {
    mkdirSync(TEMP_DIR, { recursive: true });
    writeFileSync(join(TEMP_DIR, "128.0.6613.138.manifest"), "");

    expect(getLocalVersion(TEMP_DIR)).toBe("128.0.6613.138");
  });
});
