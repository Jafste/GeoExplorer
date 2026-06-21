import { describe, expect, it } from "vitest";
import { formatDistanceKm, formatScore, formatSeconds } from "./format";

describe("format helpers", () => {
  it("formats common score, distance and timer labels", () => {
    expect(formatScore(1234)).toBe("1234 pts");
    expect(formatScore(null)).toBe("Sem dados");
    expect(formatDistanceKm(12.34)).toBe("12.3 km");
    expect(formatDistanceKm(undefined)).toBe("Sem dados");
    expect(formatSeconds(75)).toBe("01:15");
  });
});
