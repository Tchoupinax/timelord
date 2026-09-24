/**
 * Loaded via `tsx --require ./env-preload.mts` (after `fnox exec` injects secrets).
 *
 * Node's `--env-file` does not override variables already in the environment.
 * This applies `server/.env` on top using `util.parseEnv` so local overrides win.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), ".env");

if (existsSync(envPath)) {
  const parsed = parseEnv(readFileSync(envPath, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }
}
