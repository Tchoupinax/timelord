import path from "node:path";

import { defineConfig } from "prisma/config";

import { resolveDatabaseUrl } from "./src/tools/database-url.mts";

function prismaCliDatabaseUrl(): string {
  try {
    return resolveDatabaseUrl();
  } catch {
    return "_";
  }
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "npx tsx prisma/seed.mts",
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: prismaCliDatabaseUrl(),
  },
});
