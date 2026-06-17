import { describe, expect, it } from "vitest";
import {
  getInteractivePanoramaMode,
  getScenePhotoCandidates,
  isPanoramicImageDimensions,
  shouldContainScenePhoto,
} from "./ChallengeSceneArt";
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
    sceneImage: "/legacy-scenes/ignored.svg",
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
  it("orders selected media and alternate visual sources without using mock scene images", () => {
    const candidates = getScenePhotoCandidates(createChallenge());

    expect(candidates.map((candidate) => candidate.imageUrl)).toEqual([
      "/api/media/mapillary/1117445272087508",
      "https://example.test/wikimedia.jpg",
    ]);
    expect(candidates[0].media?.sourceProvider).toBe("Mapillary");
    expect(candidates[1].media?.sourceProvider).toBe("Wikimedia Commons");
  });
});

describe("getInteractivePanoramaMode", () => {
  it("enables the interactive viewer for Panoramax street-level sources", () => {
    expect(
      getInteractivePanoramaMode({
        sourceProvider: "Panoramax",
        imageUrl: "https://panoramax.example.test/sd.jpg",
        streetViewProvider: "Panoramax",
      }),
    ).not.toBeNull();
    expect(
      getInteractivePanoramaMode({
        sourceProvider: "Panoramax",
        imageUrl: "https://panoramax.example.test/sd.jpg",
        streetViewProvider: "Panoramax",
      }),
    ).toBe("360");
  });

  it("keeps regular photo providers in the static image path before dimensions are known", () => {
    expect(
      getInteractivePanoramaMode({
        sourceProvider: "Wikimedia Commons",
        imageUrl: "https://example.test/photo.jpg",
      }),
    ).toBeNull();
    expect(
      getInteractivePanoramaMode({
        sourceProvider: "Mapillary",
        imageUrl: "/api/media/mapillary/123",
        streetViewProvider: "Mapillary",
      }),
    ).toBeNull();
  });

  it("enables a 360 viewer for panoramic Mapillary images after loading dimensions", () => {
    expect(
      getInteractivePanoramaMode(
        {
          sourceProvider: "Mapillary",
          imageUrl: "/api/media/mapillary/123",
          streetViewProvider: "Mapillary",
        },
        { width: 2048, height: 1024 },
      ),
    ).toBe("360");
  });

  it("enables partial panorama interaction for other very wide images", () => {
    expect(
      getInteractivePanoramaMode(
        {
          sourceProvider: "Wikimedia Commons",
          imageUrl: "https://example.test/panorama.jpg",
        },
        { width: 2400, height: 900 },
      ),
    ).toBe("panorama");
  });

  it("does not treat normal landscape photos as panoramic", () => {
    expect(isPanoramicImageDimensions({ width: 1600, height: 900 })).toBe(false);
    expect(
      getInteractivePanoramaMode(
        {
          sourceProvider: "Mapillary",
          imageUrl: "/api/media/mapillary/123",
          streetViewProvider: "Mapillary",
        },
        { width: 1600, height: 900 },
      ),
    ).toBeNull();
  });

  it("keeps portrait and narrow photos fully visible instead of cover-cropping them", () => {
    expect(shouldContainScenePhoto({ width: 1536, height: 2048 })).toBe(true);
    expect(shouldContainScenePhoto({ width: 1600, height: 900 })).toBe(false);
  });
});
