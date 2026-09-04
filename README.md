# chromium_launcher

A Windows launcher that keeps a portable [ungoogled-chromium](https://github.com/ungoogled-software/ungoogled-chromium-windows) build up to date.

Each run checks GitHub for the latest release, compares it to the version already on disk, and downloads, verifies, and extracts an update.

Built with [Bun](https://bun.com).

## Setup

```bash
bun install
```

## Commands

| Command | What it does |
| --- | --- |
| `bun run start` | Run the launcher |
| `bun run test` | Run the test suite |
| `bun run check` | Type-check, lint, and format |
| `bun run compile_exe` | Build `dist/chromium_launcher.exe` |

The compiled exe stores its Chromium build in a `bin/` folder next to itself.
