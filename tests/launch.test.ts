import { describe, expect, it } from "bun:test";
import { buildChromeArgs } from "../src/launch.ts";

describe("buildChromeArgs", () => {
  it("splits the command line into separate arguments", () => {
    const args = buildChromeArgs(
      "--flag-switches-begin --user-data-dir=..\\profile --flag-switches-end",
    );
    expect(args).toEqual([
      "--flag-switches-begin",
      "--user-data-dir=..\\profile",
      "--flag-switches-end",
    ]);
  });

  it("collapses repeated whitespace and trims the ends", () => {
    expect(buildChromeArgs("  --foo   --bar  ")).toEqual(["--foo", "--bar"]);
  });

  it("returns an empty list when the command line is empty", () => {
    expect(buildChromeArgs("")).toEqual([]);
  });
});
