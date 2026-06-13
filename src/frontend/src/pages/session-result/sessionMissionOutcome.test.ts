import { describe, expect, it } from "vitest";
import type { SessionConfig } from "../../types/game";
import { getSessionMissionOutcome, getSessionTargetRatio } from "./sessionMissionOutcome";

const baseConfig: SessionConfig = {
  region: "europe",
  roundCount: 5,
  timed: true,
  roundTimeSeconds: 60,
};

describe("getSessionTargetRatio", () => {
  it("raises the target when the player has no timer pressure", () => {
    expect(getSessionTargetRatio({ timed: false, roundTimeSeconds: null })).toBe(0.72);
  });

  it("scales the target down for shorter timed rounds", () => {
    expect(getSessionTargetRatio({ timed: true, roundTimeSeconds: 60 })).toBe(0.66);
    expect(getSessionTargetRatio({ timed: true, roundTimeSeconds: 30 })).toBe(0.54);
    expect(getSessionTargetRatio({ timed: true, roundTimeSeconds: 10 })).toBe(0.36);
  });
});

describe("getSessionMissionOutcome", () => {
  it("marks the mission as successful when the scaled score target is reached", () => {
    expect(
      getSessionMissionOutcome({
        config: baseConfig,
        totalRounds: 5,
        totalScore: 16_500,
      })
    ).toEqual(
      expect.objectContaining({
        success: true,
        targetScore: 16_500,
        title: "Alvos encontrados.",
        status: "Sucesso",
      })
    );
  });

  it("keeps the mission pending when the player misses the scaled score target", () => {
    expect(
      getSessionMissionOutcome({
        config: baseConfig,
        totalRounds: 5,
        totalScore: 16_000,
      })
    ).toEqual(
      expect.objectContaining({
        success: false,
        remainingScore: 500,
        title: "Não foi desta vez.",
        status: "Por localizar",
      })
    );
  });
});
