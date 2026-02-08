import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/prisma/index.js";
import { env } from "./tools/env.mts";

const adapter = new PrismaPg({ connectionString: buildDatabaseUrl() });
const prismaClient = new PrismaClient({ adapter });

export const prisma = prismaClient;

function buildDatabaseUrl(): string {
  const username = env.POSTGRES_USERNAME;
  const password = env.POSTGRES_PASSWORD;
  const hostname = env.POSTGRES_HOSTNAME;
  const port = env.POSTGRES_PORT ?? 5432;
  const database = env.POSTGRES_DATABASE;

  if (username && password && hostname && database) {
    return `postgresql://${username}:${password}@${hostname}:${port}/${database}`;
  }

  return "";
}
