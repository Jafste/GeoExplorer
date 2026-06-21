import { describe, expect, it } from "vitest";
import { clearSoloSessionResume, readSoloSessionResume, saveSoloSessionResume } from "./soloSessionResume";
import type { SessionConfig } from "../types/game";

function createStorage(initialValue: string | null = null) {
  let value = initialValue;

  return {
    getItem: () => value,
    removeItem: () => {
      value = null;
    },
    setItem: (_key: string, nextValue: string) => {
      value = nextValue;
    },
  };
}

const config: SessionConfig = {
  region: "europe",
  roundCount: 5,
  timed: true,
  roundTimeSeconds: 60,
};

describe("solo session resume", () => {
  it("round-trips a valid resume snapshot", () => {
    const storage = createStorage();

    saveSoloSessionResume(storage, {
      config,
      currentRoundId: "round-1",
      currentSessionScore: 1200,
      phase: "round",
      roundEndsAt: "2026-06-21T10:01:00.000Z",
      roundResolution: null,
      sessionId: "session-1",
      sessionResult: null,
    });

    expect(readSoloSessionResume(storage)).toMatchObject({
      currentRoundId: "round-1",
      currentSessionScore: 1200,
      phase: "round",
      sessionId: "session-1",
    });

    clearSoloSessionResume(storage);
    expect(readSoloSessionResume(storage)).toBeNull();
  });

  it("ignores broken stored data", () => {
    expect(readSoloSessionResume(createStorage("{"))).toBeNull();
    expect(readSoloSessionResume(createStorage(JSON.stringify({ phase: "round" })))).toBeNull();
  });
});
