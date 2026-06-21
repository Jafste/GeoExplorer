import { formatScore } from "../../app/format";
import type { MapHotspot } from "../../components/EuropeGuessMap";
import type { MultiplayerRoundResult } from "../../types/game";

export function getRoundResultPlayerHotspots(
  roundResult: MultiplayerRoundResult,
  currentPlayerId: string
): MapHotspot[] {
  return roundResult.playerResults.flatMap((result) => {
    if (!result.guess || result.playerId === currentPlayerId) {
      return [];
    }

    return [{
      label: result.displayName,
      latitude: result.guess.latitude,
      longitude: result.guess.longitude,
      value: formatScore(result.score),
    }];
  });
}
