import { randomUUID } from "node:crypto";

import axios from "axios";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { E2E_PORT } from "../../config/e2e-env.mts";

describe("when listing agents", () => {
  const recentName = `agent-recent-${randomUUID()}`;
  const olderName = `agent-older-${randomUUID()}`;
  let agents: Array<{ name: string; token?: string }>;

  beforeAll(async () => {
    await prisma.agent.deleteMany();

    await prisma.agent.createMany({
      data: [
        {
          name: olderName,
          userId: TEST_USER_ID,
          token: randomUUID(),
          version: "1.0.0",
          seenAt: new Date("2023-01-01T00:00:00.000Z"),
        },
        {
          name: recentName,
          userId: TEST_USER_ID,
          token: randomUUID(),
          version: "1.1.0",
          seenAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ],
    });

    ({ data: agents } = await axios<Array<{ name: string }>>({
      url: `http://localhost:${E2E_PORT}/agents`,
      headers: { "Content-Type": "application/json" },
    }));
  });

  afterAll(async () => {
    await prisma.agent.deleteMany();
  });

  it("should return both agents ordered by seenAt desc", () => {
    const names = agents.map(agent => agent.name);
    expect(names).toEqual([recentName, olderName]);
  });

  it("should not expose the agent token", () => {
    expect(agents.every(agent => agent.token === undefined)).toBe(true);
  });
});
