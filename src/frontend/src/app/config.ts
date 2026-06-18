import type { DataMode, SessionConfig } from "../types/game";

export const appConfig = {
  dataMode: (import.meta.env.VITE_DATA_MODE ?? "api") as DataMode,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
};

export const defaultSessionConfig: SessionConfig = {
  region: "europe",
  country: null,
  countries: [],
  roundCount: 5,
  timed: true,
  roundTimeSeconds: 60,
};
