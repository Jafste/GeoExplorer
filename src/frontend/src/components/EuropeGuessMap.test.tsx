import { describe, expect, it } from "vitest";
import { isWithinEuropePlayableBounds } from "../app/guessMapBounds";
import { escapeLeafletHtml } from "./leafletHtml";

describe("EuropeGuessMap marker labels", () => {
  it("escapes label HTML before Leaflet interpolation", () => {
    expect(escapeLeafletHtml(`R1 <img src=x onerror="alert('x')"> & Porto`)).toBe(
      "R1 &lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; Porto"
    );
  });
});

describe("EuropeGuessMap playable bounds", () => {
  it("accepts Atlantic islands and the Canary Islands in the supported map", () => {
    expect(isWithinEuropePlayableBounds({ latitude: 37.7412, longitude: -25.6756 })).toBe(true);
    expect(isWithinEuropePlayableBounds({ latitude: 32.7607, longitude: -16.9595 })).toBe(true);
    expect(isWithinEuropePlayableBounds({ latitude: 28.2916, longitude: -16.6291 })).toBe(true);
  });

  it("keeps clearly unsupported guesses outside the map", () => {
    expect(isWithinEuropePlayableBounds({ latitude: 26.5, longitude: -16.6291 })).toBe(false);
    expect(isWithinEuropePlayableBounds({ latitude: 37.7412, longitude: -32 })).toBe(false);
  });
});
