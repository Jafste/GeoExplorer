import type { SessionConfig } from "../../types/game";

const MAX_SCORE_PER_ROUND = 5000;

interface SessionMissionOutcomeInput {
  config: SessionConfig;
  totalRounds: number;
  totalScore: number;
}

export interface SessionMissionOutcome {
  success: boolean;
  title: string;
  status: string;
  summary: string;
  targetScore: number;
  remainingScore: number;
}

export function getSessionTargetRatio(config: Pick<SessionConfig, "timed" | "roundTimeSeconds">) {
  if (!config.timed) {
    return 0.72;
  }

  const seconds = config.roundTimeSeconds ?? 60;

  if (seconds <= 10) {
    return 0.36;
  }

  if (seconds <= 20) {
    return 0.46;
  }

  if (seconds <= 30) {
    return 0.54;
  }

  if (seconds <= 45) {
    return 0.6;
  }

  return 0.66;
}

export function getSessionMissionOutcome({
  config,
  totalRounds,
  totalScore,
}: SessionMissionOutcomeInput): SessionMissionOutcome {
  const safeRounds = Math.max(1, totalRounds);
  const targetScore = Math.round(MAX_SCORE_PER_ROUND * safeRounds * getSessionTargetRatio(config));
  const remainingScore = Math.max(0, targetScore - totalScore);
  const success = totalScore >= targetScore;

  if (success) {
    return {
      success,
      title: "Alvos encontrados.",
      status: "Sucesso",
      summary: `Objetivo cumprido: ${totalScore.toLocaleString("pt-PT")} de ${targetScore.toLocaleString("pt-PT")} pts.`,
      targetScore,
      remainingScore,
    };
  }

  return {
    success,
    title: "Não foi desta vez.",
    status: "Por localizar",
    summary: `Faltaram ${remainingScore.toLocaleString("pt-PT")} pts para encontrar os alvos. Para a próxima.`,
    targetScore,
    remainingScore,
  };
}
