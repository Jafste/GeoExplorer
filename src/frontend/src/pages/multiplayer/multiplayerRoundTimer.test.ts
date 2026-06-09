import { describe, expect, it } from "vitest";
import type { ChallengeRound } from "../../types/game";
import {
  formatMultiplayerRoundTimer,
  getMultiplayerRoundRemainingSeconds,
} from "./multiplayerRoundTimer";

const baseRound: ChallengeRound = {
  id: "round-1",
  roundNumber: 1,
  totalRounds: 3,
  timed: true,
  timeLimitSeconds: 60,
  endsAt: "2026-06-08T20:31:00.000Z",
  challenge: {
    id: "location-1",
    title: "Local",
    city: "Porto",
    country: "Portugal",
    category: "historic-core",
    sceneLabel: "Cena",
    sceneNote: "Nota",
    prompt: "Prompt",
    visualGradient: ["#000000", "#111111", "#222222"],
    visualSources: [],
    clues: [],
  },
};

describe("getMultiplayerRoundRemainingSeconds", () => {
  it("calculates the remaining multiplayer round time from the server end time", () => {
    expect(
      getMultiplayerRoundRemainingSeconds(
        baseRound,
        new Date("2026-06-08T20:30:25.500Z").getTime()
      )
    ).toBe(35);
  });

  it("clamps expired rounds to zero", () => {
    expect(
      getMultiplayerRoundRemainingSeconds(
        baseRound,
        new Date("2026-06-08T20:31:01.000Z").getTime()
      )
    ).toBe(0);
  });
});

describe("formatMultiplayerRoundTimer", () => {
  it("formats timed and untimed round labels", () => {
    expect(formatMultiplayerRoundTimer(baseRound, 35)).toBe("00:35 restantes");
    expect(formatMultiplayerRoundTimer({ ...baseRound, timed: false, timeLimitSeconds: null }, null)).toBe("Livre");
  });
});
