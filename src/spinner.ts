const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function renderSpinnerFrame(frameIndex: number): string {
  return FRAMES[frameIndex % FRAMES.length] as string;
}

export async function withSpinner<T>(
  message: string,
  task: () => Promise<T>,
): Promise<T> {
  let frameIndex = 0;
  const draw = () => {
    process.stdout.write(`\r${renderSpinnerFrame(frameIndex)} ${message}`);
    frameIndex++;
  };

  draw();
  const interval = setInterval(draw, 80);

  try {
    return await task();
  } finally {
    clearInterval(interval);
    process.stdout.write(`\r${" ".repeat(message.length + 2)}\r`);
  }
}
