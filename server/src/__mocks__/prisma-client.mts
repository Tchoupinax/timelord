import { PrismaClient } from "#prisma-run";

import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

beforeEach(() => {
  mockReset(prisma);
});

export const prisma = mockDeep<PrismaClient>();
