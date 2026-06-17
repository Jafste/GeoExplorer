export const EUROPE_VIEW_BOUNDS = {
  minLatitude: 34,
  maxLatitude: 72,
  minLongitude: -25,
  maxLongitude: 45,
} as const;

export const EUROPE_PLAYABLE_BOUNDS = {
  minLatitude: 27.5,
  maxLatitude: 72,
  minLongitude: -31.5,
  maxLongitude: 45,
} as const;

export function isWithinEuropePlayableBounds({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return (
    latitude >= EUROPE_PLAYABLE_BOUNDS.minLatitude &&
    latitude <= EUROPE_PLAYABLE_BOUNDS.maxLatitude &&
    longitude >= EUROPE_PLAYABLE_BOUNDS.minLongitude &&
    longitude <= EUROPE_PLAYABLE_BOUNDS.maxLongitude
  );
}
