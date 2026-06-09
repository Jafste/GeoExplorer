import type { ChallengeRound } from "../../types/game";
import { formatSeconds } from "../round/utils/roundFormat";

export function getMultiplayerRoundRemainingSeconds(
  round: ChallengeRound,
  now = Date.now()
): number | null {
  if (!round.timed || round.timeLimitSeconds === null) {
    return null;
  }

  if (!round.endsAt) {
    return round.timeLimitSeconds;
  }

  const endsAtMs = Date.parse(round.endsAt);
  if (Number.isNaN(endsAtMs)) {
    return round.timeLimitSeconds;
  }

  return Math.max(0, Math.ceil((endsAtMs - now) / 1000));
}

export function formatMultiplayerRoundTimer(
  round: ChallengeRound,
  remainingSeconds: number | null
): string {
  if (!round.timed) {
    return "Livre";
  }

  return `${formatSeconds(remainingSeconds ?? 0)} restantes`;
}
