import { describe, expect, it } from "vitest";
import { getComparisonFitPadding, getComparisonLabelSides, getComparisonMaxZoom } from "./europeGuessMapFit";

const sampledDistancesKm = [
  1, 3, 8, 15, 30, 31, 50, 80, 81, 120, 140, 141, 200, 300, 301, 450, 700, 701, 900, 1200,
  1500, 1501, 1800, 2200, 2600, 3000, 3001, 3600, 4200, 5000, 6500, 8000,
];

describe("EuropeGuessMap comparison fit", () => {
  it("keeps enough fit padding for markers at every sampled distance", () => {
    const paddings = sampledDistancesKm.map((distance) => getComparisonFitPadding(distance)[0]);

    expect(sampledDistancesKm).toHaveLength(32);
    expect(Math.min(...paddings)).toBeGreaterThanOrEqual(32);
  });

  it("keeps the zoom cap tight or tighter as comparison distance grows", () => {
    const zoomCaps = sampledDistancesKm.map((distance) => getComparisonMaxZoom(distance));

    expect(zoomCaps).toEqual([...zoomCaps].sort((a, b) => b - a));
    expect(Math.min(...zoomCaps)).toBe(8);
    expect(Math.max(...zoomCaps)).toBe(15);
  });

  it("uses aggressive fit bands across close, medium and long distances", () => {
    expect(getComparisonFitPadding(null)).toEqual([48, 48]);
    expect(getComparisonFitPadding(80)).toEqual([56, 56]);
    expect(getComparisonFitPadding(81)).toEqual([44, 44]);
    expect(getComparisonFitPadding(300)).toEqual([44, 44]);
    expect(getComparisonFitPadding(301)).toEqual([36, 36]);
    expect(getComparisonFitPadding(700)).toEqual([36, 36]);
    expect(getComparisonFitPadding(701)).toEqual([32, 32]);
    expect(getComparisonFitPadding(1500)).toEqual([32, 32]);
    expect(getComparisonFitPadding(1501)).toEqual([56, 56]);
    expect(getComparisonFitPadding(3087.5)).toEqual([56, 56]);
  });

  it("places comparison labels toward the inside of the two-marker span", () => {
    expect(
      getComparisonLabelSides({ longitude: -9.67 }, { longitude: 18.61 })
    ).toEqual({ actualLabelSide: "left", guessLabelSide: "right" });

    expect(
      getComparisonLabelSides({ longitude: 18.61 }, { longitude: -9.67 })
    ).toEqual({ actualLabelSide: "right", guessLabelSide: "left" });
  });
});
