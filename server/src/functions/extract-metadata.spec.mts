import { CronExpressionParser } from "cron-parser";
import { describe, expect, it, vi } from "vitest";

import { extractMetadata, Metadata } from "./extract-metadata.mts";

describe("Extract metadata", () => {
  it("should extract cron when it is present", () => {
    const file = `#!/bin/bash
#>> Timelord
#>> What: Test cron
#>> When: 55 15 * * *
echo "Test file"`;

    expect(extractMetadata(file)).toEqual({
      cron: "55 15 * * *",
      cronIsActive: expect.any(Boolean) as boolean,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      nextDate: expect.any(String),
      title: "Test cron",
      keepLastCount: -1,
    } satisfies Metadata);
  });

  it("should return empty cron if it is not present", () => {
    const file = `#!/bin/bash
#>> Timelord
#>> What: Test no cron
echo "Test file"`;

    expect(extractMetadata(file)).toEqual({
      cron: "",
      cronIsActive: false,
      nextDate: "",
      title: "Test no cron",
      keepLastCount: -1,
    } satisfies Metadata);
  });

  it("should extract title when it is present", () => {
    const file = `
      #!/bin/bash
      //#>> Timelord
      //#>> What: Aliquip incididunt reprehenderit
      echo "Test file
    `;

    expect(extractMetadata(file).title).toEqual(
      "Aliquip incididunt reprehenderit",
    );
  });

  it("should extract how much items are kept when it is present", () => {
    const file = `
      #!/bin/bash
      #>> Timelord
      #>> What: Aliquip incididunt reprehenderit
      #>> KeepLast: 4
      echo "Test file
    `;

    expect(extractMetadata(file).keepLastCount).toBe(4);
  });

  it("should handle when keeplast isn't a number", () => {
    const file = `
      #!/bin/bash
      #>> Timelord
      #>> What: Aliquip incididunt reprehenderit
      #>> KeepLast: d
      echo "Test file
    `;

    expect(extractMetadata(file).keepLastCount).toBe(-1);
  });

  it("should keep cron active for the whole period after the scheduled time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-23T10:30:00.000Z"));

    const file = `
      #!/bin/bash
      #>> Timelord
      #>> When: 0 * * * *
      echo "Test file"
    `;

    const metadata = extractMetadata(file);
    const interval = CronExpressionParser.parse("0 * * * *", {
      currentDate: new Date("2026-06-23T10:30:00.000Z"),
    });

    expect(metadata.cronIsActive).toBe(true);
    expect(metadata.nextDate).toBe(interval.prev().toDate().toISOString());

    vi.useRealTimers();
  });

  it("should keep cron active on period boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-23T10:00:00.000Z"));

    const file = `
      #!/bin/bash
      #>> Timelord
      #>> When: 0 * * * *
      echo "Test file"
    `;

    expect(extractMetadata(file).cronIsActive).toBe(true);

    vi.useRealTimers();
  });
});
