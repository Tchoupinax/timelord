import { randomUUID } from "node:crypto";

import axios from "axios";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { E2E_PORT } from "../../config/e2e-env.mts";

describe("when deleting an agent", () => {
  const name = `agent-delete-${randomUUID()}`;
  let status: number;
  let data: unknown;

  beforeAll(async () => {
    await prisma.agent.deleteMany({ where: { name } });
    await prisma.agent.create({
      data: { name, userId: TEST_USER_ID, token: randomUUID() },
    });

    ({ status, data } = await axios<string>({
      url: `http://localhost:${E2E_PORT}/agents/${name}`,
      method: "DELETE",
    }));
  });

  afterAll(async () => {
    await prisma.agent.deleteMany({ where: { name } });
  });

  it("should acknowledge the deletion", () => {
    expect(status).toEqual(200);
    expect(data).toEqual("OK");
  });

  it("should remove the agent from the database", async () => {
    const agent = await prisma.agent.findUnique({ where: { name } });
    expect(agent).toBeNull();
  });
});
