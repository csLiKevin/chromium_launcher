import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import {
  extractBaseVersion,
  getLocalVersion,
  isUpToDate,
  parseVersionOutput,
} from "../src/version.ts";

describe("parseVersionOutput", () => {
  it("extracts the version number from Chromium's --version output", () => {
    expect(parseVersionOutput("Chromium 128.0.6613.138 \n")).toBe(
      "128.0.6613.138",
    );
  });

  it("returns null when no version number is present", () => {
    expect(parseVersionOutput("command not found")).toBeNull();
  });
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
  it("returns null when the executable does not exist", async () => {
    const missingExePath = join(
      import.meta.dir,
      "..",
      "dist",
      "does_not_exist.exe",
    );
    expect(await getLocalVersion(missingExePath)).toBeNull();
  });
});
