import { describe, expect, it } from "vitest";
import {
  getMultiplayerPlayerStatus,
  getMultiplayerRoundResolutionLabel,
} from "./multiplayerLabels";

describe("getMultiplayerPlayerStatus", () => {
  it("shows offline players as offline during a round", () => {
    expect(
      getMultiplayerPlayerStatus({
        connected: false,
        disconnectGraceEndsAt: null,
        isOwner: false,
        submitted: false,
      }, "playing")
    ).toBe("Offline");
  });

  it("shows disconnected players with an active grace period as reconnecting", () => {
    expect(
      getMultiplayerPlayerStatus({
        connected: false,
        disconnectGraceEndsAt: "2026-06-09T12:00:00Z",
        isOwner: false,
        submitted: false,
      }, "playing")
    ).toBe("A reconectar");
  });

  it("keeps owner and connected labels in the lobby", () => {
    expect(
      getMultiplayerPlayerStatus({
        connected: true,
        disconnectGraceEndsAt: null,
        isOwner: true,
        submitted: false,
      }, "lobby")
    ).toBe("Dono da sala");

    expect(
      getMultiplayerPlayerStatus({
        connected: true,
        disconnectGraceEndsAt: null,
        isOwner: false,
        submitted: false,
      }, "lobby")
    ).toBe("Ligado");
  });

  it("shows submitted state during a round", () => {
    expect(
      getMultiplayerPlayerStatus({
        connected: true,
        disconnectGraceEndsAt: null,
        isOwner: false,
        submitted: true,
      }, "playing")
    ).toBe("Palpite enviado");
  });
});

describe("getMultiplayerRoundResolutionLabel", () => {
  it("maps multiplayer round result reasons to player-facing labels", () => {
    expect(getMultiplayerRoundResolutionLabel("manual")).toBe("Palpite registado");
    expect(getMultiplayerRoundResolutionLabel("timeout")).toBe("Tempo esgotado");
    expect(getMultiplayerRoundResolutionLabel("missing")).toBe("Sem palpite");
    expect(getMultiplayerRoundResolutionLabel("disconnect")).toBe("Vitória por abandono");
  });
});
