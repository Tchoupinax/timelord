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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      periodEnd: expect.any(String),
      title: "Test cron",
      keepLastCount: -1,
      timezone: "",
      timezoneInvalid: false,
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
      periodEnd: "",
      title: "Test no cron",
      keepLastCount: -1,
      timezone: "",
      timezoneInvalid: false,
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

    expect(metadata.cronIsActive).toBe(true);
    expect(metadata.nextDate).toBe("2026-06-23T10:00:00.000Z");
    expect(metadata.periodEnd).toBe("2026-06-23T11:00:00.000Z");

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

  it("should interpret When in the script timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T08:30:00.000Z"));

    const file = `
      #!/bin/bash
      #>> Timelord
      #>> Timezone: Europe/Paris
      #>> When: 0 9 * * *
      echo "Test file"
    `;

    const metadata = extractMetadata(file);

    expect(metadata.timezone).toBe("Europe/Paris");
    expect(metadata.timezoneInvalid).toBe(false);
    // 09:00 in Paris (CET, UTC+1) is 08:00 UTC. 08:30 UTC is inside that period.
    expect(metadata.nextDate).toBe("2026-01-15T08:00:00.000Z");
    expect(metadata.periodEnd).toBe("2026-01-16T08:00:00.000Z");
    expect(metadata.cronIsActive).toBe(true);

    vi.useRealTimers();
  });

  it("should ignore an unrecognized timezone and keep UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-23T10:30:00.000Z"));

    const file = `
      #!/bin/bash
      #>> Timelord
      #>> Timezone: Not/AZone
      #>> When: 0 * * * *
      echo "Test file"
    `;

    const metadata = extractMetadata(file);

    expect(metadata.timezone).toBe("Not/AZone");
    expect(metadata.timezoneInvalid).toBe(true);
    expect(metadata.nextDate).toBe("2026-06-23T10:00:00.000Z");

    vi.useRealTimers();
  });
});
