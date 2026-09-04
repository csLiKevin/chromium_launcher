import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { renderSpinnerFrame, withSpinner } from "../src/spinner.ts";

describe("renderSpinnerFrame", () => {
  it("returns a single glyph for each frame index", () => {
    for (let i = 0; i < 10; i++) {
      expect(renderSpinnerFrame(i)).not.toBe("");
    }
  });

  it("wraps around after the last frame", () => {
    expect(renderSpinnerFrame(0)).toBe(renderSpinnerFrame(10));
  });

  it("returns different glyphs for different frame indices within a cycle", () => {
    expect(renderSpinnerFrame(0)).not.toBe(renderSpinnerFrame(1));
  });
});

describe("withSpinner", () => {
  const originalWrite = process.stdout.write.bind(process.stdout);
  let writes: string[] = [];

  beforeEach(() => {
    writes = [];
    process.stdout.write = ((chunk: string) => {
      writes.push(chunk);
      return true;
    }) as typeof process.stdout.write;
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
  });

  it("draws the first frame immediately, without waiting for the interval", async () => {
    const promise = withSpinner("Loading...", () => Promise.resolve(42));
    expect(writes.length).toBeGreaterThan(0);
    expect(await promise).toBe(42);
  });

  it("resolves with the task's return value", async () => {
    const result = await withSpinner("Loading...", () =>
      Promise.resolve("done"),
    );
    expect(result).toBe("done");
  });
});
