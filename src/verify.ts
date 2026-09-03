export async function verify(filePath: string, expectedSha256: string): Promise<void> {
  const actual = new Bun.CryptoHasher("sha256")
    .update(await Bun.file(filePath).arrayBuffer())
    .digest("hex");

  if (actual !== expectedSha256) {
    await Bun.file(filePath).delete();
    throw new Error(`Checksum mismatch: expected ${expectedSha256}, got ${actual}`);
  }
}
