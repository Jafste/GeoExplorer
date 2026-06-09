import { describe, expect, it } from "vitest";
import {
  buildMultiplayerHubUrl,
  createRandomMultiplayerDisplayName,
  formatMultiplayerConnectionClosedMessage,
  formatMultiplayerError,
} from "./multiplayerClient";

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

  it("keeps generated names inside the backend display-name limit", () => {
    const names = Array.from({ length: 100 }, () => createRandomMultiplayerDisplayName());

    expect(names.every((name) => name.length >= 6 && name.length <= 24)).toBe(true);
    expect(names.every((name) => name.split(" ").length === 3)).toBe(true);
  });
});

describe("formatMultiplayerError", () => {
  it("removes SignalR HubException technical text from missing-room errors", () => {
    const message = formatMultiplayerError(
      new Error(
        "An unexpected error occurred invoking 'AnnounceJoining' on the server. HubException: Sala não encontrada."
      ),
      "Erro fallback"
    );

    expect(message).toBe("Sala não existe ou credenciais inválidas.");
  });

  it("maps invalid room password to a product-level room access message", () => {
    const message = formatMultiplayerError(
      new Error(
        "An unexpected error occurred invoking 'JoinRoom' on the server. HubException: Password da sala inválida."
      ),
      "Erro fallback"
    );

    expect(message).toBe("Sala não existe ou credenciais inválidas.");
  });

  it("keeps other backend validation messages without the SignalR wrapper", () => {
    const message = formatMultiplayerError(
      new Error(
        "An unexpected error occurred invoking 'SubmitGuess' on the server. HubException: A sala não tem uma ronda ativa."
      ),
      "Erro fallback"
    );

    expect(message).toBe("A sala não tem uma ronda ativa.");
  });

  it("uses the fallback when the thrown value is not an Error", () => {
    expect(formatMultiplayerError("erro", "Erro fallback")).toBe("Erro fallback");
  });
});

describe("formatMultiplayerConnectionClosedMessage", () => {
  it("does not show a banner for intentional client stops", () => {
    expect(formatMultiplayerConnectionClosedMessage(undefined, true)).toBe("");
    expect(formatMultiplayerConnectionClosedMessage(new Error("Closed"), true)).toBe("");
  });

  it("does not show a banner for normal closes without a connection error", () => {
    expect(formatMultiplayerConnectionClosedMessage(undefined, false)).toBe("");
  });

  it("keeps a useful message for unexpected connection failures", () => {
    expect(formatMultiplayerConnectionClosedMessage(new Error("Server timeout elapsed."), false)).toBe(
      "Server timeout elapsed."
    );
  });
});
