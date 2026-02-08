import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "#prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prismaClient = new PrismaClient({ adapter });

async function rawSql() {
  await prismaClient.$executeRaw`INSERT INTO "users" ("id", "email", "master_token_for_agent") VALUES ('1207d4c8-24fe-4c72-b4ec-a9e0b2248723', 'dev@timelord.local', 'agent-master-token-for-dev') ON CONFLICT DO NOTHING;`;
}

rawSql()
  .then(async () => {
    await prismaClient.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prismaClient.$disconnect();
    process.exit(1);
  });
