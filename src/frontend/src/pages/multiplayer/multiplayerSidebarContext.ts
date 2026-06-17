import type { MultiplayerSidebarContext } from "../../app/sidebarContext";
import type {
  ChallengeRound,
  MultiplayerPlayer,
  MultiplayerRoomState,
  MultiplayerRoundResult,
  MultiplayerSessionResult,
  SessionConfig,
} from "../../types/game";

interface BuildMultiplayerSidebarContextOptions {
  config: SessionConfig;
  currentPlayer: MultiplayerPlayer | null;
  currentRound: ChallengeRound | null;
  displayName: string;
  finalResult: MultiplayerSessionResult | null;
  hasReady: boolean;
  hasSubmitted: boolean;
  isApiMode: boolean;
  isOwner: boolean;
  isPublicRoom: boolean;
  loadingOpenRooms: boolean;
  openRoomCount: number;
  openRoomsLoaded: boolean;
  playerId: string;
  remainingSeconds: number | null;
  room: MultiplayerRoomState | null;
  roomPassword: string;
  roundResult: MultiplayerRoundResult | null;
}

export function buildMultiplayerSidebarContext({
  config,
  currentPlayer,
  currentRound,
  displayName,
  finalResult,
  hasReady,
  hasSubmitted,
  isApiMode,
  isOwner,
  isPublicRoom,
  loadingOpenRooms,
  openRoomCount,
  openRoomsLoaded,
  playerId,
  remainingSeconds,
  room,
  roomPassword,
  roundResult,
}: BuildMultiplayerSidebarContextOptions): MultiplayerSidebarContext {
  if (!isApiMode) {
    return {
      mode: "api-required",
      config,
    };
  }

  if (!room) {
    return {
      mode: "entry",
      config,
      displayName: displayName.trim(),
      hasPassword: Boolean(roomPassword.trim()),
      isPublic: isPublicRoom,
      loadingOpenRooms,
      openRoomCount,
      openRoomsLoaded,
    };
  }

  const connectedPlayerCount = room.players.filter((player) => player.connected).length;
  const latestRoundResult = roundResult ?? room.lastRoundResult;
  const ownRoundResult =
    latestRoundResult?.playerResults.find((result) => result.playerId === playerId) ?? null;
  const completedResult = finalResult ?? room.finalResult;
  const ownFinalResult =
    completedResult?.players.find((result) => result.playerId === playerId) ?? null;
  const finalRank = completedResult
    ? completedResult.players.findIndex((result) => result.playerId === playerId)
    : -1;

  return {
    mode: room.status,
    config: room.config,
    connectedPlayerCount,
    currentPlayerScore: ownFinalResult?.totalScore ?? currentPlayer?.totalScore ?? null,
    displayName: currentPlayer?.displayName ?? displayName.trim(),
    finalRank: finalRank >= 0 ? finalRank + 1 : null,
    hasPassword: room.hasPassword,
    hasReady,
    hasSubmitted,
    isOwner,
    isPublic: room.isPublic,
    latestRoundDistanceKm: ownRoundResult?.distanceKm ?? null,
    latestRoundScore: ownRoundResult?.score ?? null,
    playerCount: room.players.length,
    remainingSeconds,
    roomCode: room.roomCode,
    roundNumber:
      currentRound?.roundNumber ??
      latestRoundResult?.roundNumber ??
      completedResult?.totalRounds,
    totalRounds:
      currentRound?.totalRounds ??
      latestRoundResult?.totalRounds ??
      completedResult?.totalRounds ??
      room.config.roundCount,
  };
}
