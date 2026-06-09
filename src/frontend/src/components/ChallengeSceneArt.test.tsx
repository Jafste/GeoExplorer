import { describe, expect, it } from "vitest";
import { getScenePhotoCandidates } from "./ChallengeSceneArt";
import type { ChallengeRound } from "../types/game";

function createChallenge(): ChallengeRound["challenge"] {
  return {
    id: "porto-test",
    title: "Porto",
    city: "Porto",
    country: "Portugal",
    category: "historic-core",
    sceneLabel: "Rua histórica",
    sceneNote: "Fachadas e rua estreita.",
    sceneImage: "/mock-scenes/historic-core-street.svg",
    prompt: "Observa a rua.",
    visualGradient: ["#111111", "#222222", "#333333"],
    media: {
      sourceProvider: "Mapillary",
      imageUrl: "/api/media/mapillary/1117445272087508",
      imageSourceUrl: "https://www.mapillary.com/app/?pKey=1117445272087508",
    },
    visualSources: [
      {
        sourceProvider: "Mapillary",
        imageUrl: "/api/media/mapillary/1117445272087508",
        imageSourceUrl: "https://www.mapillary.com/app/?pKey=1117445272087508",
      },
      {
        sourceProvider: "Wikimedia Commons",
        imageUrl: "https://example.test/wikimedia.jpg",
        imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Teste.jpg",
      },
    ],
    clues: [],
  };
}

describe("getScenePhotoCandidates", () => {
  it("orders selected media, alternate visual sources and local scene image without duplicates", () => {
    const candidates = getScenePhotoCandidates(createChallenge());

    expect(candidates.map((candidate) => candidate.imageUrl)).toEqual([
      "/api/media/mapillary/1117445272087508",
      "https://example.test/wikimedia.jpg",
      "/mock-scenes/historic-core-street.svg",
    ]);
    expect(candidates[0].media?.sourceProvider).toBe("Mapillary");
    expect(candidates[1].media?.sourceProvider).toBe("Wikimedia Commons");
    expect(candidates[2].media).toBeUndefined();
  });
});
