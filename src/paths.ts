import { join } from "node:path";
import { isAbsolute } from "node:path/win32";

export function expandEnvVars(
  input: string,
  env: Record<string, string | undefined> = process.env,
): string {
  return input.replace(/%([^%]+)%/g, (match, name) => env[name] ?? match);
}

// Setting values follow Windows path conventions (e.g. ".\bin", "%LOCALAPPDATA%\foo"),
// regardless of the host OS this happens to run on, so slashes are normalized before
// joining with the native path module.
export function resolveSettingsPath(
  rawPath: string,
  baseDir: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const expanded = expandEnvVars(rawPath, env).replaceAll("\\", "/");
  return isAbsolute(expanded) ? expanded : join(baseDir, expanded);
}
