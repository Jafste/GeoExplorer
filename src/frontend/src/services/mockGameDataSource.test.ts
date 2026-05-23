import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockGameDataSource } from "./mockGameDataSource";
import type { SeedLocation } from "../types/game";

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

  it("avoids very close locations in the same mock session when alternatives exist", async () => {
    const dataSource = createMockGameDataSource({
      locations: [
        createLocation({ id: "nearby-a", latitude: 41.1402, longitude: -8.611 }),
        createLocation({ id: "nearby-b", latitude: 41.14025, longitude: -8.61105 }),
        createLocation({ id: "far-away", latitude: 38.7169, longitude: -9.1399 }),
      ],
      randomIndex: () => 0,
    });

    const session = await dataSource.createSession({
      region: "europe",
      roundCount: 2,
      timed: false,
      roundTimeSeconds: null,
    });

    const firstRound = session.currentRound;
    await dataSource.timeoutRound(session.sessionId, firstRound.id, null);
    const secondRound = await dataSource.getCurrentRound(session.sessionId);

    expect([firstRound.challenge.id, secondRound.challenge.id]).toEqual(["nearby-a", "far-away"]);
  });

  it("completes a multi-round mock session and returns the accumulated results", async () => {
    const dataSource = createMockGameDataSource({ randomIndex: () => 0 });

    const session = await dataSource.createSession({
      region: "europe",
      roundCount: 2,
      timed: false,
      roundTimeSeconds: null,
    });
    const firstResolution = await dataSource.submitGuess(session.sessionId, session.currentRound.id, {
      latitude: 41.1496,
      longitude: -8.6109,
      label: "Palpite",
    });
    const secondRound = await dataSource.getCurrentRound(session.sessionId);
    const secondResolution = await dataSource.timeoutRound(session.sessionId, secondRound.id, null);
    const results = await dataSource.getSessionResults(session.sessionId);

    expect(firstResolution.progress.completed).toBe(false);
    expect(secondResolution.progress.completed).toBe(true);
    expect(results.rounds).toHaveLength(2);
    expect(results.totalScore).toBe(firstResolution.result.score + secondResolution.result.score);
  });

  it("uses the same basic session validation as the API", async () => {
    const dataSource = createMockGameDataSource();

    await expect(
      dataSource.createSession({
        region: "europe",
        roundCount: 11,
        timed: false,
        roundTimeSeconds: null,
      })
    ).rejects.toThrow("O número de rondas deve estar entre 1 e 10.");
  });
});

function createLocation(overrides: Partial<SeedLocation>): SeedLocation {
  return {
    id: "test-location",
    title: "Local de teste",
    city: "Porto",
    country: "Portugal",
    region: "europe",
    category: "historic-core",
    latitude: 41.1402,
    longitude: -8.611,
    sceneLabel: "Rua de teste",
    sceneNote: "Nota visual de teste.",
    sceneImage: "/mock-scenes/test.svg",
    prompt: "Observa o local de teste.",
    visualGradient: ["#111111", "#222222", "#333333"],
    media: {
      sourceProvider: "Wikimedia Commons",
      imageUrl: "https://example.test/wikimedia.jpg",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Teste.jpg",
      imageAttribution: "Autor Wikimedia",
      imageLicense: "CC BY-SA 4.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      verifiedAt: "2026-05-23",
    },
    clues: [
      {
        label: "Pista",
        value: "Pista visual de teste",
        confidence: "Alta",
      },
    ],
    ...overrides,
  };
}
