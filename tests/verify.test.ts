import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { verify } from "../src/verify.ts";

const TEMP_DIR = join(import.meta.dir, "..", "dist", "test_tmp");

afterEach(() => {
  rmSync(TEMP_DIR, { recursive: true, force: true });
});

async function writeTemp(name: string, content: string): Promise<string> {
  mkdirSync(TEMP_DIR, { recursive: true });
  const path = join(TEMP_DIR, name);
  await Bun.write(path, content);
  return path;
}

async function sha256hex(content: string): Promise<string> {
  return new Bun.CryptoHasher("sha256")
    .update(new TextEncoder().encode(content))
    .digest("hex");
}

describe("verify", () => {
  it("resolves when the checksum matches", async () => {
    const content = "hello world";
    const path = await writeTemp("good.bin", content);
    const hash = await sha256hex(content);
    expect(verify(path, hash)).resolves.toBeUndefined();
  });

  it("throws and deletes the file when checksum mismatches", async () => {
    const path = await writeTemp("bad.bin", "hello world");

    let error: unknown;
    try {
      await verify(path, "0".repeat(64));
    } catch (caught) {
      error = caught;
    }

    expect((error as Error).message).toContain("Checksum mismatch");
    expect(await Bun.file(path).exists()).toBe(false);
  });
});
