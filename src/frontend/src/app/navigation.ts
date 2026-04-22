import type { RoundResolutionResponse, SessionResult } from "../types/game";

export type SurfacePhase = "landing" | "setup" | "round" | "round-result" | "session-result";

interface AnalysisPhaseInput {
  roundResolution: RoundResolutionResponse | null;
  sessionResult: SessionResult | null;
}

export function getAnalysisPhase({
  roundResolution,
  sessionResult,
}: AnalysisPhaseInput): SurfacePhase {
  if (sessionResult) {
    return "session-result";
  }

  if (roundResolution) {
    return "round-result";
  }

  return "landing";
}
