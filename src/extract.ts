import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { unzip } from "fflate";

const unzipAsync = promisify(unzip);

export async function extractZip(
  zipPath: string,
  destinationDir: string,
): Promise<void> {
  const data = await Bun.file(zipPath).bytes();
  const files = await unzipAsync(data);

  const writes = Object.entries(files)
    .filter(([name]) => !name.endsWith("/"))
    .map(([name, fileData]) => {
      const outPath = join(destinationDir, name);
      mkdirSync(dirname(outPath), { recursive: true });
      return Bun.write(outPath, fileData);
    });

  await Promise.all(writes);
}
