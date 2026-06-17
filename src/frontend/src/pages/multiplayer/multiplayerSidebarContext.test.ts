import { describe, expect, it } from "vitest";
import type {
  ChallengeRound,
  MultiplayerRoomState,
  MultiplayerRoundResult,
  MultiplayerSessionResult,
  SessionConfig,
} from "../../types/game";
import { buildMultiplayerSidebarContext } from "./multiplayerSidebarContext";

const config: SessionConfig = {
  region: "europe",
  roundCount: 3,
  timed: true,
  roundTimeSeconds: 60,
};

const currentRound: ChallengeRound = {
  id: "round-2",
  roundNumber: 2,
  totalRounds: 3,
  timed: true,
  timeLimitSeconds: 60,
  challenge: {
    id: "porto",
    title: "Ribeira",
    city: "Porto",
    country: "Portugal",
    category: "Cidade",
    sceneLabel: "Cais",
    sceneNote: "Vista urbana",
    prompt: "Onde fica?",
    visualGradient: ["#111111", "#222222", "#333333"],
    clues: [],
  },
};

function buildRoom(overrides: Partial<MultiplayerRoomState> = {}): MultiplayerRoomState {
  return {
    roomCode: "AB12CD",
    status: "playing",
    ownerPlayerId: "p1",
    isPublic: true,
    hasPassword: true,
    config,
    currentRound,
    lastRoundResult: null,
    finalResult: null,
    players: [
      {
        playerId: "p1",
        displayName: "Marcos",
        isOwner: true,
        connected: true,
        disconnectGraceEndsAt: null,
        submitted: false,
        ready: false,
        totalScore: 1200,
      },
      {
        playerId: "p2",
        displayName: "Ana",
        isOwner: false,
        connected: false,
        disconnectGraceEndsAt: "2026-06-14T12:00:00.000Z",
        submitted: true,
        ready: false,
        totalScore: 900,
      },
    ],
    ...overrides,
  };
}

describe("buildMultiplayerSidebarContext", () => {
  it("builds entry context before a room is joined", () => {
    expect(
      buildMultiplayerSidebarContext({
        config,
        currentPlayer: null,
        currentRound: null,
        displayName: " Marcos ",
        finalResult: null,
        hasReady: false,
        hasSubmitted: false,
        isApiMode: true,
        isOwner: false,
        isPublicRoom: true,
        loadingOpenRooms: false,
        openRoomCount: 2,
        openRoomsLoaded: true,
        playerId: "",
        remainingSeconds: null,
        room: null,
        roomPassword: " segredo ",
        roundResult: null,
      })
    ).toEqual({
      mode: "entry",
      config,
      displayName: "Marcos",
      hasPassword: true,
      isPublic: true,
      loadingOpenRooms: false,
      openRoomCount: 2,
      openRoomsLoaded: true,
    });
  });

  it("uses the player final rank and latest round result when a room is completed", () => {
    const roundResult: MultiplayerRoundResult = {
      roomCode: "AB12CD",
      roundId: "round-2",
      roundNumber: 2,
      totalRounds: 3,
      title: "Ribeira",
      city: "Porto",
      country: "Portugal",
      correctLatitude: 41.1405,
      correctLongitude: -8.611,
      clues: [],
      completed: true,
      nextRoundNumber: 3,
      playerResults: [
        {
          playerId: "p1",
          displayName: "Marcos",
          guess: null,
          score: 800,
          distanceKm: 12.5,
          resolution: "manual",
        },
      ],
    };
    const finalResult: MultiplayerSessionResult = {
      roomCode: "AB12CD",
      totalRounds: 3,
      rounds: [roundResult],
      players: [
        { playerId: "p2", displayName: "Ana", totalScore: 2200 },
        { playerId: "p1", displayName: "Marcos", totalScore: 2000 },
      ],
    };

    expect(
      buildMultiplayerSidebarContext({
        config,
        currentPlayer: buildRoom().players[0],
        currentRound: null,
        displayName: "Fallback",
        finalResult,
        hasReady: true,
        hasSubmitted: true,
        isApiMode: true,
        isOwner: true,
        isPublicRoom: false,
        loadingOpenRooms: false,
        openRoomCount: 0,
        openRoomsLoaded: false,
        playerId: "p1",
        remainingSeconds: null,
        room: buildRoom({
          status: "completed",
          currentRound: null,
          lastRoundResult: roundResult,
          finalResult,
        }),
        roomPassword: "",
        roundResult: null,
      })
    ).toMatchObject({
      mode: "completed",
      connectedPlayerCount: 1,
      currentPlayerScore: 2000,
      displayName: "Marcos",
      finalRank: 2,
      latestRoundDistanceKm: 12.5,
      latestRoundScore: 800,
      roundNumber: 2,
      totalRounds: 3,
    });
  });
});
