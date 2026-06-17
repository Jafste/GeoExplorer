import type { MultiplayerOpenRoom, SessionConfig } from "../../types/game";

export function formatOpenRoomPlayerCount(playerCount: number) {
  return `${playerCount} jogador${playerCount === 1 ? "" : "es"}`;
}

export function formatOpenRoomTimer(openRoom: MultiplayerOpenRoom) {
  if (!openRoom.timed) {
    return "Sem limite";
  }

  return openRoom.roundTimeSeconds ? `${openRoom.roundTimeSeconds}s por ronda` : "Cronometrada";
}

export function formatSessionTimer(config: Pick<SessionConfig, "timed" | "roundTimeSeconds">) {
  if (!config.timed) {
    return "sem limite de tempo";
  }

  return config.roundTimeSeconds ? `${config.roundTimeSeconds}s por ronda` : "rondas cronometradas";
}

export function getOpenRoomSearchText(openRoom: MultiplayerOpenRoom) {
  return [
    openRoom.roomCode,
    openRoom.ownerDisplayName,
    `${openRoom.roundCount} rondas`,
    formatOpenRoomTimer(openRoom),
    formatOpenRoomPlayerCount(openRoom.playerCount),
    openRoom.hasPassword ? "protegida password" : "sem password",
  ]
    .join(" ")
    .toLowerCase();
}
