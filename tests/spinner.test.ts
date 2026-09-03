import { describe, expect, it } from "bun:test";
import { renderSpinnerFrame } from "../src/spinner.ts";

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
