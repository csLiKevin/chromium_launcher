import type { EventEmitter } from "node:events";

export interface DownloadProgress {
  downloaded: number;
  total: number;
}

export async function download(url: string, destinationPath: string, emitter?: EventEmitter): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const total = Number(response.headers.get("content-length") ?? 0);
  let downloaded = 0;

  const writer = Bun.file(destinationPath).writer();
  for await (const chunk of response.body) {
    writer.write(chunk);
    downloaded += chunk.byteLength;
    emitter?.emit("progress", downloaded, total);
  }
  await writer.end();
}
