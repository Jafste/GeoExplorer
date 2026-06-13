import { describe, expect, it } from "vitest";
import { buildRestorableViewUrl, getAnalysisPhase, getInitialRouteState } from "./navigation";
import type { RoundResolutionResponse, SessionResult } from "../types/game";

const roundResolution = {
  result: {
    roundId: "round-1",
    roundNumber: 1,
    title: "Teste",
    city: "Lisboa",
    country: "Portugal",
    correctLatitude: 38.7223,
    correctLongitude: -9.1393,
    guess: null,
    score: 4200,
    distanceKm: 12,
    resolution: "manual",
    timed: true,
    clues: [],
  },
  progress: {
    completed: false,
    nextRoundNumber: 2,
  },
} satisfies RoundResolutionResponse;

const sessionResult = {
  sessionId: "session-1",
  totalScore: 4200,
  totalRounds: 5,
  timed: true,
  roundTimeSeconds: 60,
  rounds: [],
} satisfies SessionResult;

describe("getAnalysisPhase", () => {
  it("opens the session report when one exists", () => {
    expect(
      getAnalysisPhase({
        roundResolution,
        sessionResult,
      })
    ).toBe("session-result");
  });

  it("falls back to the round report when the session report is not ready", () => {
    expect(
      getAnalysisPhase({
        roundResolution,
        sessionResult: null,
      })
    ).toBe("round-result");
  });

  it("returns to landing when there is no analysis state yet", () => {
    expect(
      getAnalysisPhase({
        roundResolution: null,
        sessionResult: null,
      })
    ).toBe("landing");
  });
});

describe("getInitialRouteState", () => {
  it("restores the setup view from the URL", () => {
    expect(getInitialRouteState("?view=setup")).toEqual({
      phase: "setup",
      roomCode: null,
    });
  });

  it("restores the multiplayer entry view from the URL", () => {
    expect(getInitialRouteState("?view=multiplayer")).toEqual({
      phase: "multiplayer",
      roomCode: null,
    });
  });

  it("prioritizes room links over generic view links", () => {
    expect(getInitialRouteState("?view=setup&room=ab12cd")).toEqual({
      phase: "multiplayer",
      roomCode: "AB12CD",
    });
  });

  it("falls back to the homepage for unknown views", () => {
    expect(getInitialRouteState("?view=round")).toEqual({
      phase: "landing",
      roomCode: null,
    });
  });
});

describe("buildRestorableViewUrl", () => {
  it("keeps the homepage clean", () => {
    expect(buildRestorableViewUrl("/geo", "landing")).toBe("/geo");
  });

  it("writes a refreshable setup URL", () => {
    expect(buildRestorableViewUrl("/geo", "setup")).toBe("/geo?view=setup");
  });
});
