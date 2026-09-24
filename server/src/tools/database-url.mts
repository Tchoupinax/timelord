/**
 * How the server picks a Postgres URL (Prisma, Studio, seed, scripts):
 *
 * 1. **DATABASE_URL** — used when set in the environment and not the fnox placeholder `"_"`.
 *    Set this in `server/.env`; with `pnpm watch`, `env-preload.mts` applies `.env` after fnox
 *    so your URL overrides fnox defaults.
 * 2. **POSTGRES_*** — built into a URL when DATABASE_URL is unset or `"_"`.
 */

export function maskDatabaseUrl(url: string): string {
  return url.replace(/:\/\/([^:@/]+):([^@/]+)@/, "://$1:***@");
}

export type DatabaseUrlEnv = {
  DATABASE_URL?: string;
  POSTGRES_USERNAME?: string;
  POSTGRES_PASSWORD?: string;
  POSTGRES_HOSTNAME?: string;
  POSTGRES_PORT?: string | number;
  POSTGRES_DATABASE?: string;
};

export function isUsableDatabaseUrl(url: string | undefined): url is string {
  if (url === undefined) {
    return false;
  }
  const trimmed = url.trim();
  return trimmed.length > 0 && trimmed !== "_";
}

export function resolveDatabaseUrl(
  env: DatabaseUrlEnv = process.env as DatabaseUrlEnv,
): string {
  if (isUsableDatabaseUrl(env.DATABASE_URL)) {
    return env.DATABASE_URL.trim();
  }

  const username = env.POSTGRES_USERNAME;
  const password = env.POSTGRES_PASSWORD;
  const hostname = env.POSTGRES_HOSTNAME;
  const port = env.POSTGRES_PORT ?? "5432";
  const database = env.POSTGRES_DATABASE;

  if (username && password && hostname && database) {
    return `postgresql://${username}:${password}@${hostname}:${port}/${database}`;
  }

  throw new Error(
    "Database not configured: set DATABASE_URL, or POSTGRES_USERNAME, POSTGRES_PASSWORD, POSTGRES_HOSTNAME, and POSTGRES_DATABASE",
  );
}
