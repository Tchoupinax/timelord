import { randomUUID } from "node:crypto";

import axios from "axios";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { E2E_PORT } from "../../config/e2e-env.mts";

describe("when creating an agent", () => {
  const name = `agent-${randomUUID()}`;
  let token: string | undefined;

  beforeAll(async () => {
    await prisma.agent.deleteMany({ where: { name } });

    ({ data: { token } = {} as { token?: string } } = await axios<{ token: string }>({
      url: `http://localhost:${E2E_PORT}/agents`,
      headers: { "Content-Type": "application/json" },
      method: "POST",
      data: { name },
    }));
  });

  afterAll(async () => {
    await prisma.agent.deleteMany({ where: { name } });
  });

  it("should return a generated token", () => {
    expect(typeof token).toBe("string");
    expect(token).toHaveLength(36);
  });

  it("should persist the agent for the current user", async () => {
    const agent = await prisma.agent.findUnique({ where: { name } });

    expect(agent).not.toBeNull();
    expect(agent?.userId).toEqual(TEST_USER_ID);
    expect(agent?.token).toEqual(token);
  });
});
