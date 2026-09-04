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

// Reads the file in chunks rather than one large Bun.file().bytes() call, so
// the event loop (and anything animating on a timer, like a spinner) isn't
// starved while a large zip is read into memory.
async function readFileInChunks(path: string): Promise<Uint8Array> {
  const file = Bun.file(path);
  const buffer = new Uint8Array(file.size);
  let offset = 0;
  for await (const chunk of file.stream()) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer;
}

export async function extractZip(
  zipPath: string,
  destinationDir: string,
): Promise<void> {
  const data = await readFileInChunks(zipPath);
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
