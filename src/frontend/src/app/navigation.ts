import type { RoundResolutionResponse, SessionResult } from "../types/game";

export type SurfacePhase =
  | "landing"
  | "setup"
  | "round"
  | "round-result"
  | "session-result"
  | "multiplayer";

export type RestorableSurfacePhase = Extract<SurfacePhase, "landing" | "setup" | "multiplayer">;

export interface InitialRouteState {
  phase: RestorableSurfacePhase;
  roomCode: string | null;
}

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

export function getInitialRouteState(search: string): InitialRouteState {
  const params = new URLSearchParams(search);
  const roomCode = params.get("room")?.trim();

  if (roomCode) {
    return {
      phase: "multiplayer",
      roomCode: roomCode.toUpperCase(),
    };
  }

  const view = params.get("view");

  if (view === "setup" || view === "multiplayer") {
    return {
      phase: view,
      roomCode: null,
    };
  }

  return {
    phase: "landing",
    roomCode: null,
  };
}

export function buildRestorableViewUrl(pathname: string, phase: RestorableSurfacePhase) {
  if (phase === "landing") {
    return pathname;
  }

  const params = new URLSearchParams();
  params.set("view", phase);
  return `${pathname}?${params.toString()}`;
}
