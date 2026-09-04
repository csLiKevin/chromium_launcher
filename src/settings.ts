const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface Settings {
  // Days between update checks: -1 forces a check every run, 0 disables checking.
  chromiumCheckPeriod: number;
  lastUpdateCheck: string | null;
  // Relative (to the launcher directory) or full path; env vars like %LOCALAPPDATA% are supported.
  chromiumDirectory: string;
  userDataDirectory: string;
}

const DEFAULT_SETTINGS: Settings = {
  chromiumCheckPeriod: 1,
  lastUpdateCheck: null,
  chromiumDirectory: String.raw`.\bin`,
  userDataDirectory: String.raw`..\profile`,
};

export async function readSettings(settingsPath: string): Promise<Settings> {
  if (!(await Bun.file(settingsPath).exists())) {
    return DEFAULT_SETTINGS;
  }

  try {
    return { ...DEFAULT_SETTINGS, ...(await Bun.file(settingsPath).json()) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function writeSettings(
  settingsPath: string,
  settings: Settings,
): Promise<void> {
  await Bun.write(settingsPath, JSON.stringify(settings, null, 2));
}

// Returns a human-readable reason to skip the update check, or null if it should proceed.
export function getUpdateCheckSkipReason(
  lastUpdateCheck: string | null,
  chromiumCheckPeriod: number,
  now: Date = new Date(),
): string | null {
  if (chromiumCheckPeriod === -1) {
    return null;
  }
  if (chromiumCheckPeriod === 0) {
    return "update checking is disabled";
  }
  if (lastUpdateCheck === null) {
    return null;
  }

  const lastCheckTime = new Date(lastUpdateCheck).getTime();
  if (Number.isNaN(lastCheckTime)) {
    return null;
  }

  const daysSinceLastCheck = (now.getTime() - lastCheckTime) / MS_PER_DAY;
  if (daysSinceLastCheck >= chromiumCheckPeriod) {
    return null;
  }

  return `last checked ${lastUpdateCheck}`;
}
