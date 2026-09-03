import { describe, expect, it } from "bun:test";
import { formatBytes, renderProgressBar } from "../src/progress.ts";

describe("formatBytes", () => {
  it("formats bytes", () => expect(formatBytes(512)).toBe("512 B"));
  it("formats kilobytes", () => expect(formatBytes(1536)).toBe("1.5 KB"));
  it("formats megabytes", () =>
    expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.5 MB"));
  it("formats gigabytes", () =>
    expect(formatBytes(1024 ** 3 * 1.2)).toBe("1.2 GB"));
});

describe("renderProgressBar", () => {
  it("shows percentage and sizes when total is known", () => {
    const bar = renderProgressBar(512 * 1024, 1024 * 1024, 10);
    expect(bar).toContain("50%");
    expect(bar).toContain("512.0 KB");
    expect(bar).toContain("1.0 MB");
  });

  it("shows downloaded size when total is unknown", () => {
    const bar = renderProgressBar(1024, 0);
    expect(bar).toContain("1.0 KB");
    expect(bar).not.toContain("%");
  });

  it("clamps to 100% when downloaded exceeds total", () => {
    const bar = renderProgressBar(2000, 1000, 10);
    expect(bar).toContain("100%");
  });

  it("bar string has correct width", () => {
    const bar = renderProgressBar(500, 1000, 20);
    const inner = bar.match(/\[(.+)\]/)?.[1] ?? "";
    expect(inner.length).toBe(20);
  });
});
