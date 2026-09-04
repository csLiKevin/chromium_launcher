import { afterEach, describe, expect, it } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import {
  getUpdateCheckSkipReason,
  readSettings,
  writeSettings,
} from "../src/settings.ts";

const TEMP_DIR = join(import.meta.dir, "..", "dist", "test_tmp");

afterEach(async () => {
  await rm(TEMP_DIR, { recursive: true, force: true });
});

describe("readSettings", () => {
  it("returns default settings when the file does not exist", async () => {
    const settingsPath = join(TEMP_DIR, "settings.json");
    expect(await readSettings(settingsPath)).toEqual({
      chromiumCheckPeriod: 1,
      lastUpdateCheck: null,
    });
  });

  it("returns default settings when the file is not valid JSON", async () => {
    await mkdir(TEMP_DIR, { recursive: true });
    const settingsPath = join(TEMP_DIR, "settings.json");
    await Bun.write(settingsPath, "not json");

    expect(await readSettings(settingsPath)).toEqual({
      chromiumCheckPeriod: 1,
      lastUpdateCheck: null,
    });
  });

  it("reads back previously written settings", async () => {
    await mkdir(TEMP_DIR, { recursive: true });
    const settingsPath = join(TEMP_DIR, "settings.json");

    await writeSettings(settingsPath, {
      chromiumCheckPeriod: 3,
      lastUpdateCheck: "2026-01-01T00:00:00.000Z",
    });

    expect(await readSettings(settingsPath)).toEqual({
      chromiumCheckPeriod: 3,
      lastUpdateCheck: "2026-01-01T00:00:00.000Z",
    });
  });
});

describe("getUpdateCheckSkipReason", () => {
  const now = new Date("2026-01-10T00:00:00.000Z");

  it("does not skip when chromiumCheckPeriod is -1, regardless of last check time", () => {
    expect(getUpdateCheckSkipReason(now.toISOString(), -1, now)).toBeNull();
  });

  it("skips with a reason when chromiumCheckPeriod is 0", () => {
    expect(getUpdateCheckSkipReason(null, 0, now)).toBe(
      "update checking is disabled",
    );
  });

  it("does not skip when there is no recorded last check time", () => {
    expect(getUpdateCheckSkipReason(null, 5, now)).toBeNull();
  });

  it("does not skip when the recorded last check time is not a valid date", () => {
    expect(getUpdateCheckSkipReason("not a date", 5, now)).toBeNull();
  });

  it("skips with a reason when fewer days than the period have passed", () => {
    const lastUpdateCheck = "2026-01-09T00:00:00.000Z";
    expect(getUpdateCheckSkipReason(lastUpdateCheck, 2, now)).toBe(
      `last checked ${lastUpdateCheck}`,
    );
  });

  it("does not skip when at least the period's worth of days have passed", () => {
    const lastUpdateCheck = "2026-01-08T00:00:00.000Z";
    expect(getUpdateCheckSkipReason(lastUpdateCheck, 2, now)).toBeNull();
  });
});
