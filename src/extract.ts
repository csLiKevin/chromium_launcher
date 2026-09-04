import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { unzip } from "fflate";

const unzipAsync = promisify(unzip);

// ungoogled-chromium's release zips wrap all their contents in a single
// version-named folder; strip it so the payload lands directly in destinationDir.
export function stripLeadingDirectory(entryName: string): string {
  const separatorIndex = entryName.indexOf("/");
  return separatorIndex === -1
    ? entryName
    : entryName.slice(separatorIndex + 1);
}

export async function extractZip(
  zipPath: string,
  destinationDir: string,
): Promise<void> {
  const data = await Bun.file(zipPath).bytes();
  const files = await unzipAsync(data);

  const writes = Object.entries(files)
    .filter(([name]) => !name.endsWith("/"))
    .map(async ([name, fileData]) => {
      const outPath = join(destinationDir, stripLeadingDirectory(name));
      await mkdir(dirname(outPath), { recursive: true });
      await Bun.write(outPath, fileData);
    });

  await Promise.all(writes);
}
