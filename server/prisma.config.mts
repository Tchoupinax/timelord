import path from "node:path";

import { defineConfig } from "prisma/config";

function buildDatabaseUrl(): string {
  const username = process.env.POSTGRES_USERNAME;
  const password = process.env.POSTGRES_PASSWORD;
  const hostname = process.env.POSTGRES_HOSTNAME;
  const port = process.env.POSTGRES_PORT ?? "5432";
  const database = process.env.POSTGRES_DATABASE;

  if (username && password && hostname && database) {
    return `postgresql://${username}:${password}@${hostname}:${port}/${database}`;
  }

  return "_";
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "npx tsx prisma/seed.mts",
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: buildDatabaseUrl(),
  },
});
