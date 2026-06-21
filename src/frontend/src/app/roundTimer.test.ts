import { describe, expect, it } from "vitest";
import { createRoundEndsAt, getRoundRemainingSeconds } from "./roundTimer";

describe("round timer", () => {
  it("uses a real deadline instead of elapsed intervals", () => {
    const now = new Date("2026-06-21T10:00:00.000Z").getTime();
    const endsAt = createRoundEndsAt({ timed: true, timeLimitSeconds: 60, endsAt: null }, now);

    expect(endsAt).toBe("2026-06-21T10:01:00.000Z");
    expect(getRoundRemainingSeconds({ timed: true, timeLimitSeconds: 60, endsAt }, now + 25_500)).toBe(35);
    expect(getRoundRemainingSeconds({ timed: true, timeLimitSeconds: 60, endsAt }, now + 61_000)).toBe(0);
  });

  it("keeps untimed rounds free", () => {
    expect(getRoundRemainingSeconds({ timed: false, timeLimitSeconds: null, endsAt: null })).toBeNull();
  });
});
