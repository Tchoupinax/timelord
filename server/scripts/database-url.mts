/** Same resolution order as prisma.config.mts / prisma-client (for CLI scripts). */
export function resolveDatabaseUrl(): string {
  const username = process.env.POSTGRES_USERNAME;
  const password = process.env.POSTGRES_PASSWORD;
  const hostname = process.env.POSTGRES_HOSTNAME;
  const port = process.env.POSTGRES_PORT ?? "5432";
  const database = process.env.POSTGRES_DATABASE;

  if (username && password && hostname && database) {
    return `postgresql://${username}:${password}@${hostname}:${port}/${database}`;
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  throw new Error(
    "Set DATABASE_URL or POSTGRES_USERNAME, POSTGRES_PASSWORD, POSTGRES_HOSTNAME, and POSTGRES_DATABASE",
  );
}
