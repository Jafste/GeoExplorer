import { describe, expect, it } from "vitest";
import {
  createQuickSessionConfig,
  QUICK_SESSION_MAX_ROUNDS,
  QUICK_SESSION_MAX_TIME_SECONDS,
  QUICK_SESSION_MIN_TIME_SECONDS,
} from "./quickSessionConfig";

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => values[index++] ?? 0;
}

describe("createQuickSessionConfig", () => {
  it("creates a timed solo session with random rounds and seconds", () => {
    expect(createQuickSessionConfig(sequenceRandom([0.5, 0.5]))).toEqual({
      region: "europe",
      roundCount: 4,
      timed: true,
      roundTimeSeconds: 35,
    });
  });

  it("keeps random values inside the configured bounds", () => {
    expect(createQuickSessionConfig(sequenceRandom([0, 0]))).toEqual({
      region: "europe",
      roundCount: 1,
      timed: true,
      roundTimeSeconds: QUICK_SESSION_MIN_TIME_SECONDS,
    });

    expect(createQuickSessionConfig(sequenceRandom([0.999999, 0.999999]))).toEqual({
      region: "europe",
      roundCount: QUICK_SESSION_MAX_ROUNDS,
      timed: true,
      roundTimeSeconds: QUICK_SESSION_MAX_TIME_SECONDS,
    });
  });
});
