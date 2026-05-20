import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockGameDataSource } from "./mockGameDataSource";

function mockRandomIndexes(indexes: number[]) {
  let cursor = 0;

  vi.stubGlobal("crypto", {
    getRandomValues(values: Uint32Array) {
      values[0] = indexes[cursor] ?? 0;
      cursor += 1;
      return values;
    },
  });
}

describe("createMockGameDataSource", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the selected visual source as the round media", async () => {
    mockRandomIndexes([0, 1]);
    const dataSource = createMockGameDataSource();

    const session = await dataSource.createSession({
      region: "europe",
      roundCount: 1,
      timed: false,
      roundTimeSeconds: null,
    });

    expect(session.currentRound.challenge.visualSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceProvider: "Panoramax" }),
        expect.objectContaining({ sourceProvider: "Mapillary" }),
      ]),
    );
    expect(session.currentRound.challenge.media?.sourceProvider).toBe("Panoramax");
  });

  it("keeps the selected visual source in the round result", async () => {
    mockRandomIndexes([0, 1]);
    const dataSource = createMockGameDataSource();
    const session = await dataSource.createSession({
      region: "europe",
      roundCount: 1,
      timed: false,
      roundTimeSeconds: null,
    });

    const resolution = await dataSource.timeoutRound(session.sessionId, session.currentRound.id, null);

    expect(resolution.result.media?.sourceProvider).toBe("Panoramax");
    expect(resolution.result.visualSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceProvider: "Panoramax" }),
        expect.objectContaining({ sourceProvider: "Mapillary" }),
      ]),
    );
  });
});
