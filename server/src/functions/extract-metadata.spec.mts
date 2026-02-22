import { describe, expect, it } from "vitest";

import { extractMetadata, Metadata } from "./extract-metadata.mts";

describe("Extract metadata", () => {
  it("should extract cron when it is present", () => {
    const file = `
      #!/bin/bash
      //#>> Timelord
      //#>> When: 55 15 * * *
      echo "Test file
    `;

    expect(extractMetadata(file)).toEqual({
      cron: "55 15 * * *",
      cronIsActive: false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      nextDate: expect.any(String),
      title: "",
      keepLastCount: -1,
    } satisfies Metadata);
  });

  it("should return empty cron if it is not present", () => {
    const file = `
      #!/bin/bash
      //#>> Timelord
      echo "Test file
    `;

    expect(extractMetadata(file)).toEqual({
      cron: "",
      cronIsActive: false,
      nextDate: "",
      title: "",
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
});
