import { describe, expect, it } from "vitest";
import {
  MAX_ROUND_TIME_SECONDS,
  MIN_ROUND_TIME_SECONDS,
  normalizeRoundTimeSeconds,
  QUICK_ROUND_TIME_SECONDS,
} from "./RoundTimeControl";

describe("RoundTimeControl", () => {
  it("offers 20, 30 and 60 second quick options", () => {
    expect([...QUICK_ROUND_TIME_SECONDS]).toEqual([20, 30, 60]);
  });

  it("normalizes custom second values inside the supported range", () => {
    expect(normalizeRoundTimeSeconds("42")).toBe(42);
    expect(normalizeRoundTimeSeconds(12.6)).toBe(13);
    expect(normalizeRoundTimeSeconds("")).toBe(60);
  });

  it("clamps custom second values to the supported range", () => {
    expect(normalizeRoundTimeSeconds("-5")).toBe(MIN_ROUND_TIME_SECONDS);
    expect(normalizeRoundTimeSeconds("99999")).toBe(MAX_ROUND_TIME_SECONDS);
  });
});
