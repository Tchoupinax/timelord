import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/prisma/index.js";
import { resolveDatabaseUrl } from "./tools/database-url.mts";
import { env } from "./tools/env.mts";

const adapter = new PrismaPg({ connectionString: resolveDatabaseUrl(env) });
const prismaClient = new PrismaClient({ adapter });

export const prisma = prismaClient;
