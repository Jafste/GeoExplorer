import type { SessionConfig } from "../types/game";

export const QUICK_SESSION_MAX_ROUNDS = 7;
export const QUICK_SESSION_MIN_TIME_SECONDS = 10;
export const QUICK_SESSION_MAX_TIME_SECONDS = 60;

function randomIntegerInRange(min: number, max: number, random: () => number) {
  const sample = Math.min(0.999999999999, Math.max(0, random()));
  return Math.floor(sample * (max - min + 1)) + min;
}

export function createQuickSessionConfig(random = Math.random): SessionConfig {
  return {
    region: "europe",
    roundCount: randomIntegerInRange(1, QUICK_SESSION_MAX_ROUNDS, random),
    timed: true,
    roundTimeSeconds: randomIntegerInRange(
      QUICK_SESSION_MIN_TIME_SECONDS,
      QUICK_SESSION_MAX_TIME_SECONDS,
      random
    ),
  };
}
