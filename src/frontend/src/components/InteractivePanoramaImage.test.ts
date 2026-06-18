import { describe, expect, it } from "vitest";
import {
  clampInteractiveImageX,
  getPanoramaWheelZoomDelta,
  getPinchZoom,
} from "./InteractivePanoramaImage";

describe("getPanoramaWheelZoomDelta", () => {
  it("amplifies small trackpad deltas and caps large wheel jumps", () => {
    expect(getPanoramaWheelZoomDelta({ deltaMode: 0, deltaY: -8 })).toBeCloseTo(0.048);
    expect(getPanoramaWheelZoomDelta({ deltaMode: 0, deltaY: 100 })).toBe(-0.28);
    expect(getPanoramaWheelZoomDelta({ deltaMode: 1, deltaY: -1 })).toBeCloseTo(0.096);
  });
});

describe("clampInteractiveImageX", () => {
  it("stops 360 images at the edge instead of wrapping back to the other side", () => {
    expect(clampInteractiveImageX(105, "360")).toBe(100);
    expect(clampInteractiveImageX(-5, "360")).toBe(0);
  });
});

describe("getPinchZoom", () => {
  it("zooms from the two-finger distance without leaving the supported range", () => {
    expect(getPinchZoom(1, 100, 180)).toBeCloseTo(1.8);
    expect(getPinchZoom(2, 100, 200)).toBe(2.35);
    expect(getPinchZoom(1.4, 0, 200)).toBe(1.4);
  });
});
