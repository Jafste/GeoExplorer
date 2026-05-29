import { describe, expect, it } from "vitest";
import { getMultiplayerPlayerStatus } from "./multiplayerLabels";

describe("getMultiplayerPlayerStatus", () => {
  it("shows offline players as offline during a round", () => {
    expect(
      getMultiplayerPlayerStatus({
        connected: false,
        isOwner: false,
        submitted: false,
      }, "playing")
    ).toBe("Offline");
  });

  it("keeps owner and connected labels in the lobby", () => {
    expect(
      getMultiplayerPlayerStatus({
        connected: true,
        isOwner: true,
        submitted: false,
      }, "lobby")
    ).toBe("Owner");

    expect(
      getMultiplayerPlayerStatus({
        connected: true,
        isOwner: false,
        submitted: false,
      }, "lobby")
    ).toBe("Ligado");
  });

  it("shows submitted state during a round", () => {
    expect(
      getMultiplayerPlayerStatus({
        connected: true,
        isOwner: false,
        submitted: true,
      }, "playing")
    ).toBe("Palpite enviado");
  });
});
