import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

import { PrismaClient } from "#prisma-run";

beforeEach(() => {
  mockReset(prisma);
});

export const prisma = mockDeep<PrismaClient>();
