import { formatSeconds } from "../../app/format";
import { getRoundRemainingSeconds } from "../../app/roundTimer";
import type { ChallengeRound } from "../../types/game";

export function getMultiplayerRoundRemainingSeconds(
  round: ChallengeRound,
  now = Date.now()
): number | null {
  return getRoundRemainingSeconds(round, now);
}

export function formatMultiplayerRoundTimer(
  round: ChallengeRound,
  remainingSeconds: number | null
): string {
  if (!round.timed) {
    return "Livre";
  }

  return formatSeconds(remainingSeconds ?? 0);
}
