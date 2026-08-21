import { describe, expect, it } from "vitest";

import {
  agentMatchesQueueTarget,
  queueTargetMatchesJobHostname,
} from "./queue-target.mts";

describe("agentMatchesQueueTarget", () => {
  it("matches any agent when the queue entry has no target hostname", () => {
    expect(agentMatchesQueueTarget("crons-at-home", "")).toBe(true);
  });

  it("matches the targeted agent case-insensitively", () => {
    expect(agentMatchesQueueTarget("Crons-At-Home", "crons-at-home")).toBe(true);
    expect(agentMatchesQueueTarget("crons-at-home", "other-agent")).toBe(false);
  });
});

describe("queueTargetMatchesJobHostname", () => {
  it("matches jobs on the targeted agent only", () => {
    expect(
      queueTargetMatchesJobHostname("crons-at-home", "crons-at-home"),
    ).toBe(true);
    expect(queueTargetMatchesJobHostname("crons-at-home", "other-agent")).toBe(
      false,
    );
    expect(queueTargetMatchesJobHostname("", "crons-at-home")).toBe(true);
  });
});
