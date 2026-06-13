import type { MultiplayerPlayer, MultiplayerPlayerRoundResult } from "../../types/game";

type MultiplayerPlayerStatusContext = "lobby" | "playing";

type MultiplayerPlayerStatusInput = Pick<
  MultiplayerPlayer,
  "connected" | "disconnectGraceEndsAt" | "isOwner" | "submitted"
>;

export function getMultiplayerPlayerStatus(
  player: MultiplayerPlayerStatusInput,
  context: MultiplayerPlayerStatusContext
): string {
  if (!player.connected) {
    return player.disconnectGraceEndsAt ? "A reconectar" : "Offline";
  }

  if (context === "lobby") {
    return player.isOwner ? "Dono da sala" : "Ligado";
  }

  return player.submitted ? "Posição enviada" : "A jogar";
}

export function getMultiplayerRoundResolutionLabel(
  resolution: MultiplayerPlayerRoundResult["resolution"]
): string {
  switch (resolution) {
    case "manual":
      return "Posição registada";
    case "timeout":
      return "Tempo esgotado";
    case "disconnect":
      return "Vitória por abandono";
    case "missing":
    default:
      return "Sem posição";
  }
}
