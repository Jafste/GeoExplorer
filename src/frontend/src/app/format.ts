export function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? `${value.toLocaleString("pt-PT")} pts` : "Sem dados";
}

export function formatDistanceKm(value: number | null | undefined) {
  return typeof value === "number" ? `${value.toFixed(1)} km` : "Sem dados";
}

export function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
