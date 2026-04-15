import type { DataMode, GameDataSource } from "../types/game";
import { createApiGameDataSource } from "./apiGameDataSource";
import { createMockGameDataSource } from "./mockGameDataSource";

export function createGameDataSource(mode: DataMode, apiBaseUrl: string): GameDataSource {
  if (mode === "api") {
    return createApiGameDataSource(apiBaseUrl);
  }

  return createMockGameDataSource();
}
