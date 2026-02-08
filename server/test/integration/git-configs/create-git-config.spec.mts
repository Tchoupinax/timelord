import axios from "axios";
import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";

describe("when creating a git config", () => {
  let key: string;

  beforeAll(async () => {
    key = `myKey-test-${randomUUID()}`;
    await axios({
      url: "http://localhost:18888/git-configs",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      data: {
        sshPrivateKey: "abcde",
        name: key,
        sshUrl: "ssh://github.com/Tchoupinax",
      },
    });
  });

  afterAll(async () => {
    await prisma.gitConfig.delete({ where: { name: key } });
  });

  it("should have inserted the git-configs", async () => {
    const configs = await prisma.gitConfig.findMany();
    const expectedConfig = configs.filter(config => config.name === key);
    expect(expectedConfig.at(0)?.sshUrl).toEqual("ssh://github.com/Tchoupinax");
  });
});
