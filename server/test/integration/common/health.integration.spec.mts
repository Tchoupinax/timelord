import axios from "axios";
import { describe, expect, it } from "vitest";

describe("Health endpoint", () => {
  it("should return a HTTP 200 response", async () => {
    const response = await axios("http://localhost:18888/health");
    expect(response.status).toEqual(200);
  });
});
