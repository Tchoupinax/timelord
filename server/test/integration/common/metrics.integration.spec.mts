import axios from "axios";
import { describe, expect, it } from "vitest";

describe("GET /metrics", () => {
  it("should retrieve application metrics", async () => {
    const response = await axios(`http://localhost:18888/metrics`);
    expect(response.data).toContain("process_cpu_user_seconds_total");
    expect(response.data).toContain("process_cpu_system_seconds_total");
    expect(response.data).toContain("process_cpu_seconds_total");
  });
});
