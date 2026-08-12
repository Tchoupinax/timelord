import { Writable } from "node:stream";

import pino from "pino";
import { describe, expect, it } from "vitest";

import { createLoggerOptions, serviceName } from "./logger-config.mts";

describe("createLoggerOptions", () => {
  it("outputs Victoria Logs compatible JSON", () => {
    const chunks: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(chunk.toString());
        callback();
      },
    });

    const log = pino(createLoggerOptions("info"), stream);
    log.info({ job_id: "abc" }, "job received");

    const entry = JSON.parse(chunks[0]!) as Record<string, unknown>;

    expect(entry._msg).toBe("job received");
    expect(entry.level).toBe("info");
    expect(entry.service).toBe(serviceName);
    expect(entry.job_id).toBe("abc");
    expect(entry._time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
