import type { RoundResolutionResponse, SessionConfig, SessionResult } from "../types/game";

const SOLO_SESSION_RESUME_STORAGE_KEY = "geoexplorer.soloSession.resume";

export type SoloSessionResumePhase = "round" | "round-result" | "session-result";

export interface SoloSessionResume {
  config: SessionConfig;
  currentRoundId: string | null;
  currentSessionScore: number;
  phase: SoloSessionResumePhase;
  roundEndsAt: string | null;
  roundResolution: RoundResolutionResponse | null;
  sessionId: string;
  sessionResult: SessionResult | null;
}

type ResumeStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export function saveSoloSessionResume(storage: ResumeStorage, resume: SoloSessionResume) {
  storage.setItem(SOLO_SESSION_RESUME_STORAGE_KEY, JSON.stringify(resume));
}

export function readSoloSessionResume(storage: ResumeStorage): SoloSessionResume | null {
  const storedValue = storage.getItem(SOLO_SESSION_RESUME_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<SoloSessionResume>;
    if (
      typeof parsed.sessionId !== "string" ||
      !parsed.sessionId ||
      !parsed.config ||
      !isSoloResumePhase(parsed.phase)
    ) {
      return null;
    }

    return {
      config: parsed.config,
      currentRoundId: typeof parsed.currentRoundId === "string" ? parsed.currentRoundId : null,
      currentSessionScore: typeof parsed.currentSessionScore === "number" ? parsed.currentSessionScore : 0,
      phase: parsed.phase,
      roundEndsAt: typeof parsed.roundEndsAt === "string" ? parsed.roundEndsAt : null,
      roundResolution: parsed.roundResolution ?? null,
      sessionId: parsed.sessionId,
      sessionResult: parsed.sessionResult ?? null,
    };
  } catch {
    return null;
  }
}

export function clearSoloSessionResume(storage: ResumeStorage) {
  storage.removeItem(SOLO_SESSION_RESUME_STORAGE_KEY);
}

function isSoloResumePhase(value: unknown): value is SoloSessionResumePhase {
  return value === "round" || value === "round-result" || value === "session-result";
}
