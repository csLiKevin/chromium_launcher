import { describe, expect, it } from "bun:test";
import { expandEnvVars, resolveSettingsPath } from "../src/paths.ts";

describe("expandEnvVars", () => {
  it("replaces a %VAR% reference with its value", () => {
    expect(expandEnvVars("%FOO%\\bar", { FOO: "C:\\baz" })).toBe(
      "C:\\baz\\bar",
    );
  });

  it("replaces multiple references", () => {
    expect(expandEnvVars("%A%-%B%", { A: "1", B: "2" })).toBe("1-2");
  });

  it("leaves unknown references unchanged", () => {
    expect(expandEnvVars("%MISSING%\\bar", {})).toBe("%MISSING%\\bar");
  });

  it("leaves input with no references unchanged", () => {
    expect(expandEnvVars(".\\bin", {})).toBe(".\\bin");
  });
});

describe("resolveSettingsPath", () => {
  it("joins a relative path with the base directory", () => {
    expect(resolveSettingsPath(".\\bin", "/home/user/launcher")).toBe(
      "/home/user/launcher/bin",
    );
  });

  it("joins a relative path using forward slashes with the base directory", () => {
    expect(resolveSettingsPath("./bin", "/home/user/launcher")).toBe(
      "/home/user/launcher/bin",
    );
  });

  it("resolves a parent-relative path", () => {
    expect(resolveSettingsPath("..\\profile", "/home/user/launcher/bin")).toBe(
      "/home/user/launcher/profile",
    );
  });

  it("returns a Windows drive-letter absolute path unchanged", () => {
    expect(
      resolveSettingsPath("C:\\Custom\\Location", "/home/user/launcher"),
    ).toBe("C:/Custom/Location");
  });

  it("returns a POSIX-style absolute path unchanged", () => {
    expect(resolveSettingsPath("/custom/location", "/home/user/launcher")).toBe(
      "/custom/location",
    );
  });

  it("expands environment variables before resolving", () => {
    const env = { LOCALAPPDATA: "C:\\Users\\test\\AppData\\Local" };
    expect(
      resolveSettingsPath("%LOCALAPPDATA%\\thing", "/home/user/launcher", env),
    ).toBe("C:/Users/test/AppData/Local/thing");
  });
});
