export async function waitForKeyPress(
  input: NodeJS.ReadStream = process.stdin,
): Promise<void> {
  const wasRaw = input.isRaw;
  input.setRawMode?.(true);
  input.resume();

  await new Promise<void>((resolve) => {
    input.once("data", () => resolve());
  });

  input.setRawMode?.(wasRaw ?? false);
  input.pause();
}
