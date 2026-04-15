import type { DataMode, SessionConfig } from "../types/game";

export const appConfig = {
  dataMode: (import.meta.env.VITE_DATA_MODE ?? "mock") as DataMode,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
};

export const defaultSessionConfig: SessionConfig = {
  region: "europe",
  roundCount: 5,
  timed: true,
  roundTimeSeconds: 60,
};
