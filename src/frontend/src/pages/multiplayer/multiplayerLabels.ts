import type { MultiplayerPlayer } from "../../types/game";

type MultiplayerPlayerStatusContext = "lobby" | "playing";

type MultiplayerPlayerStatusInput = Pick<
  MultiplayerPlayer,
  "connected" | "isOwner" | "submitted"
>;

export function getMultiplayerPlayerStatus(
  player: MultiplayerPlayerStatusInput,
  context: MultiplayerPlayerStatusContext
): string {
  if (!player.connected) {
    return "Offline";
  }

  if (context === "lobby") {
    return player.isOwner ? "Dono da sala" : "Ligado";
  }

  return player.submitted ? "Palpite enviado" : "A jogar";
}
