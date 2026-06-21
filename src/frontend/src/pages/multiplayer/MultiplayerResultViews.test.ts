import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MultiplayerRoomState, MultiplayerRoundResult } from "../../types/game";
import { getRoundResultPlayerHotspots } from "./multiplayerResultMap";
import { MultiplayerRoundResultView } from "./MultiplayerResultViews";

vi.mock("../../components/EuropeGuessMap", () => ({
  EuropeGuessMap: () => null,
}));

const baseResult: MultiplayerRoundResult = {
  roomCode: "ABC123",
  roundId: "round-1",
  roundNumber: 1,
  totalRounds: 5,
  title: "Round",
  city: "Porto",
  country: "Portugal",
  correctLatitude: 41.1579,
  correctLongitude: -8.6291,
  clues: [],
  playerResults: [
    {
      playerId: "me",
      displayName: "Eu",
      guess: { latitude: 40, longitude: -8, label: "Meu palpite" },
      score: 900,
      distanceKm: 10,
      resolution: "manual",
    },
    {
      playerId: "ana",
      displayName: "Ana",
      guess: { latitude: 42, longitude: -7, label: "Ana" },
      score: 700,
      distanceKm: 60,
      resolution: "manual",
    },
    {
      playerId: "sem-palpite",
      displayName: "Sem palpite",
      guess: null,
      score: 0,
      distanceKm: null,
      resolution: "missing",
    },
  ],
  completed: false,
  nextRoundNumber: 2,
};

describe("getRoundResultPlayerHotspots", () => {
  it("returns only other players with submitted guesses", () => {
    expect(getRoundResultPlayerHotspots(baseResult, "me")).toEqual([
      {
        label: "Ana",
        latitude: 42,
        longitude: -7,
        value: "700 pts",
      },
    ]);
  });
});

describe("MultiplayerRoundResultView", () => {
  it("shows round scores as deltas with updated player totals", () => {
    const room: MultiplayerRoomState = {
      roomCode: "ABC123",
      status: "round-result",
      ownerPlayerId: "me",
      isPublic: true,
      hasPassword: false,
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      players: [
        {
          playerId: "me",
          displayName: "Eu",
          isOwner: true,
          connected: true,
          disconnectGraceEndsAt: null,
          submitted: true,
          ready: false,
          totalScore: 3400,
        },
        {
          playerId: "ana",
          displayName: "Ana",
          isOwner: false,
          connected: true,
          disconnectGraceEndsAt: null,
          submitted: true,
          ready: false,
          totalScore: 1200,
        },
      ],
      currentRound: null,
      lastRoundResult: baseResult,
      finalResult: null,
    };
    const html = renderToStaticMarkup(
      createElement(MultiplayerRoundResultView, {
        busy: false,
        currentPlayerId: "me",
        disconnectedPlayers: [],
        disconnectClock: 0,
        error: null,
        hasReady: false,
        onDismissError: () => undefined,
        onReadyForNextRound: () => undefined,
        playerId: "me",
        room,
        roundResult: baseResult,
        showTotalScore: true,
      })
    );

    expect(html).toContain("+900 pts");
    expect(html).toContain("Total 3400 pts");
  });
});
