import type { ChallengeRound } from "../types/game";

type TimedRound = Pick<ChallengeRound, "endsAt" | "timeLimitSeconds" | "timed">;

export function createRoundEndsAt(round: TimedRound, now = Date.now()) {
  if (!round.timed || round.timeLimitSeconds === null) {
    return null;
  }

  return new Date(now + round.timeLimitSeconds * 1000).toISOString();
}

export function getRoundRemainingSeconds(round: TimedRound, now = Date.now()) {
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
