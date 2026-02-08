import { vi } from "vitest";

vi.mock("../../src/prisma-client", async importOriginal => {
  return {
    ...(await importOriginal<typeof import("#prisma")>()),
    foo: () => "mocked",
  };
});
