const UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return unitIndex === 0
    ? `${value} B`
    : `${value.toFixed(1)} ${UNITS[unitIndex]}`;
}

export function renderProgressBar(
  downloaded: number,
  total: number,
  width = 40,
): string {
  if (total === 0) {
    return `Downloading... ${formatBytes(downloaded)}`;
  }
  const percent = Math.min(downloaded / total, 1);
  const filled = Math.round(width * percent);
  const arrow = filled < width ? ">" : "";
  const bar =
    "=".repeat(filled) +
    arrow +
    " ".repeat(Math.max(0, width - filled - arrow.length));
  return `[${bar}] ${Math.round(percent * 100)}% (${formatBytes(downloaded)} / ${formatBytes(total)})`;
}
