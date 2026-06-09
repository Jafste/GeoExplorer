import type { DataMode, GameDataSource } from "../types/game";
import { createApiGameDataSource } from "./apiGameDataSource";

export async function createGameDataSource(
  mode: DataMode,
  apiBaseUrl: string
): Promise<GameDataSource> {
  if (mode === "api") {
    return createApiGameDataSource(apiBaseUrl);
  }

  const { createMockGameDataSource } = await import("./mockGameDataSource");
  return createMockGameDataSource();
}
