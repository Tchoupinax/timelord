import { describe, expect, it } from "vitest";

import { injectSecret } from "./inject-secret.mts";

describe.skip("Get job", () => {
  it("injectSecret", async () => {
    const file = 'echo "$${AWS_BACKUP_SECRET_KEY}"';
    const expectedFile = 'echo "TOTO"';

    expect(await injectSecret(file)).toBe(expectedFile);
  });
});
