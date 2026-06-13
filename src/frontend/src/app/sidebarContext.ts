import type { MultiplayerRoomStatus, SessionConfig } from "../types/game";

export type MultiplayerSidebarMode = "api-required" | "entry" | MultiplayerRoomStatus;

export interface MultiplayerSidebarContext {
  mode: MultiplayerSidebarMode;
  config: SessionConfig;
  displayName?: string;
  roomCode?: string;
  openRoomCount?: number;
  openRoomsLoaded?: boolean;
  loadingOpenRooms?: boolean;
  playerCount?: number;
  connectedPlayerCount?: number;
  isOwner?: boolean;
  isPublic?: boolean;
  hasPassword?: boolean;
  roundNumber?: number;
  totalRounds?: number;
  remainingSeconds?: number | null;
  hasSubmitted?: boolean;
  hasReady?: boolean;
  currentPlayerScore?: number | null;
  latestRoundScore?: number | null;
  latestRoundDistanceKm?: number | null;
  finalRank?: number | null;
}
