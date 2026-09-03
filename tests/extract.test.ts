import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { zipSync } from "fflate";
import { extractZip } from "../src/extract.ts";

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

describe("extractZip", () => {
  it("extracts top-level files", async () => {
    const zipPath = await writeZip("flat.zip", { "hello.txt": "hello world" });
    const destinationDir = join(TEMP_DIR, "flat_out");

    await extractZip(zipPath, destinationDir);

    expect(await Bun.file(join(destinationDir, "hello.txt")).text()).toBe(
      "hello world",
    );
  });

  it("extracts nested files, creating directories as needed", async () => {
    const zipPath = await writeZip("nested.zip", {
      "a/b/nested.txt": "nested content",
    });
    const destinationDir = join(TEMP_DIR, "nested_out");

    await extractZip(zipPath, destinationDir);

    expect(
      await Bun.file(join(destinationDir, "a", "b", "nested.txt")).text(),
    ).toBe("nested content");
  });
});
