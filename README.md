# chromium_launcher

A Windows launcher that keeps a portable [ungoogled-chromium](https://github.com/ungoogled-software/ungoogled-chromium-windows) build up to date.

Each run checks GitHub for the latest release, compares it to the version already on disk, and downloads, verifies, and extracts an update.

Built with [Bun](https://bun.com).

## Setup

```bash
bun install
```

## Commands

| Command | Description |
| --- | --- |
| `bun run start` | Run the launcher |
| `bun run test` | Run the test suite |
| `bun run check` | Type-check, lint, and format |
| `bun run compile_exe` | Build `dist/chromium_launcher.exe` |

## Settings

A `settings.json` file next to the launcher (or in `dist/` in dev mode) controls its behavior:

| Setting | Default | Description |
| --- | --- | --- |
| `chromiumCheckPeriod` | `1` | Days between update checks. `-1` forces a check every run, `0` disables checking entirely. |
| `chromiumDirectory` | `.\bin` | Where the Chromium build lives. Relative to the launcher directory, or a full path. Supports `%ENV_VAR%` expansion. |
| `chromiumCommandLine` | `--flag-switches-begin --user-data-dir=..\profile --no-default-browser-check --flag-switches-end` | Flags passed to Chromium on launch. Relative paths in it (like the default `--user-data-dir`) resolve against `chromiumDirectory`. See the [list of switches](https://peter.sh/experiments/chromium-command-line-switches/). |
| `lastUpdateCheck` | `null` | Managed automatically — the timestamp of the last update check. |
