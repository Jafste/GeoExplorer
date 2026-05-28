import { describe, expect, it } from "vitest";
import { buildMultiplayerHubUrl, createRandomMultiplayerDisplayName } from "./multiplayerClient";

describe("buildMultiplayerHubUrl", () => {
  it("uses the same origin hub route when the API base is relative", () => {
    expect(buildMultiplayerHubUrl("/api")).toBe("/hubs/multiplayer");
  });

  it("keeps the backend origin when the API base is absolute", () => {
    expect(buildMultiplayerHubUrl("http://localhost:8080/api")).toBe(
      "http://localhost:8080/hubs/multiplayer"
    );
  });
});

describe("createRandomMultiplayerDisplayName", () => {
  it("creates a usable fallback name for the lobby", () => {
    const name = createRandomMultiplayerDisplayName();

    expect(name.length).toBeGreaterThanOrEqual(6);
    expect(name.length).toBeLessThanOrEqual(24);
  });
});
