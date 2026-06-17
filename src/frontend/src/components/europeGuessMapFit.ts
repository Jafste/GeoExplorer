import type { GuessCoordinates } from "../types/game";

export type MapLabelSide = "left" | "right";

export function getComparisonMaxZoom(distanceKm: number | null) {
  if (distanceKm === null) {
    return 12;
  }

  const distance = Math.max(1, distanceKm);

  if (distance <= 30) {
    return 15;
  }

  if (distance <= 80) {
    return 14;
  }

  if (distance <= 140) {
    return 13;
  }

  if (distance <= 300) {
    return 12;
  }

  if (distance <= 700) {
    return 11;
  }

  if (distance <= 1500) {
    return 10;
  }

  if (distance <= 3000) {
    return 9;
  }

  return 8;
}

export function getComparisonFitPadding(distanceKm: number | null): [number, number] {
  if (distanceKm === null) {
    return [48, 48];
  }

  const distance = Math.max(1, distanceKm);

  if (distance <= 80) {
    return [56, 56];
  }

  if (distance <= 300) {
    return [44, 44];
  }

  if (distance <= 700) {
    return [36, 36];
  }

  if (distance <= 1500) {
    return [32, 32];
  }

  return [56, 56];
}

export function getComparisonLabelSides(
  guess: Pick<GuessCoordinates, "longitude"> | null,
  actual: Pick<GuessCoordinates, "longitude"> | null
): { actualLabelSide: MapLabelSide; guessLabelSide: MapLabelSide } {
  const guessLabelSide = guess && actual && guess.longitude <= actual.longitude ? "right" : "left";

  return {
    actualLabelSide: guessLabelSide === "right" ? "left" : "right",
    guessLabelSide,
  };
}
