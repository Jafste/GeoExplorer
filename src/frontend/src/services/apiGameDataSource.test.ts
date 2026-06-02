import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApiGameDataSource } from "./apiGameDataSource";
import type {
  ChallengeRound,
  CreateSessionResponse,
  GuessCoordinates,
  RoundResolutionResponse,
  SessionConfig,
  SessionResult,
} from "../types/game";

const apiBaseUrl = "http://api.test/api";

const sessionConfig: SessionConfig = {
  region: "europe",
  roundCount: 2,
  timed: true,
  roundTimeSeconds: 60,
};

const challengeRound: ChallengeRound = {
  id: "round-1",
  roundNumber: 1,
  totalRounds: 2,
  timed: true,
  timeLimitSeconds: 60,
  challenge: {
    id: "porto-01",
    title: "Ribeira",
    city: "Porto",
    country: "Portugal",
    category: "Centro histórico",
    sceneLabel: "Frente ribeirinha",
    sceneNote: "Casas compactas junto ao rio.",
    sceneImage: "/mock-scenes/porto.svg",
    prompt: "Observa a frente urbana junto ao rio.",
    visualGradient: ["#111827", "#1f2937", "#84cc16"],
    media: {
      sourceProvider: "Wikimedia Commons",
      imageUrl: "https://example.test/image.jpg",
      imageAttribution: "Autor teste",
      imageLicense: "CC BY-SA 4.0",
    },
    visualSources: [
      {
        sourceProvider: "Wikimedia Commons",
        imageUrl: "https://example.test/image.jpg",
        imageAttribution: "Autor teste",
        imageLicense: "CC BY-SA 4.0",
      },
      {
        sourceProvider: "Mapillary",
        streetViewProvider: "Mapillary",
        streetViewUrl: "https://www.mapillary.com/app/?pKey=teste",
        imageAttribution: "Contribuidor Mapillary",
        imageLicense: "CC BY-SA 4.0",
      },
    ],
    clues: [
      {
        label: "Água",
        value: "Rio junto ao centro histórico",
        confidence: "Alta",
      },
    ],
  },
};

const createSessionResponse: CreateSessionResponse = {
  sessionId: "session-1",
  currentRound: challengeRound,
};

const guess: GuessCoordinates = {
  latitude: 41.1496,
  longitude: -8.6109,
  label: "Porto",
};

const resolutionResponse: RoundResolutionResponse = {
  result: {
    roundId: "round-1",
    roundNumber: 1,
    title: "Ribeira",
    city: "Porto",
    country: "Portugal",
    correctLatitude: 41.1406,
    correctLongitude: -8.611,
    guess,
    score: 4980,
    distanceKm: 1.1,
    resolution: "manual",
    timed: true,
    media: challengeRound.challenge.media,
    visualSources: challengeRound.challenge.visualSources,
    clues: challengeRound.challenge.clues,
  },
  progress: {
    completed: false,
    nextRoundNumber: 2,
  },
};

const sessionResult: SessionResult = {
  sessionId: "session-1",
  totalScore: 4980,
  totalRounds: 2,
  timed: true,
  roundTimeSeconds: 60,
  rounds: [resolutionResponse.result],
};

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200, contentType = "application/json") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

describe("createApiGameDataSource", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the expected API routes and payloads", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(createSessionResponse))
      .mockResolvedValueOnce(jsonResponse(challengeRound))
      .mockResolvedValueOnce(jsonResponse(resolutionResponse))
      .mockResolvedValueOnce(jsonResponse({ ...resolutionResponse, result: { ...resolutionResponse.result, resolution: "timeout" } }))
      .mockResolvedValueOnce(jsonResponse(sessionResult));

    const dataSource = createApiGameDataSource(apiBaseUrl);

    await expect(dataSource.createSession(sessionConfig)).resolves.toEqual(createSessionResponse);
    await expect(dataSource.getCurrentRound("session-1")).resolves.toEqual(challengeRound);
    await expect(dataSource.submitGuess("session-1", "round-1", guess)).resolves.toEqual(resolutionResponse);
    await expect(dataSource.timeoutRound("session-1", "round-1", null)).resolves.toEqual({
      ...resolutionResponse,
      result: {
        ...resolutionResponse.result,
        resolution: "timeout",
      },
    });
    await expect(dataSource.getSessionResults("session-1")).resolves.toEqual(sessionResult);

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${apiBaseUrl}/sessions`, {
      method: "POST",
      body: JSON.stringify(sessionConfig),
      headers: {
        "Content-Type": "application/json",
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${apiBaseUrl}/sessions/session-1/current-round`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${apiBaseUrl}/sessions/session-1/rounds/round-1/guess`, {
      method: "POST",
      body: JSON.stringify({ guess }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${apiBaseUrl}/sessions/session-1/rounds/round-1/timeout`, {
      method: "POST",
      body: JSON.stringify({ guess: null }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(5, `${apiBaseUrl}/sessions/session-1/results`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("uses problem details as the error message when the API returns a JSON error", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(
      {
        title: "Pedido inválido",
        detail: "O número de rondas deve estar entre 1 e 10.",
      },
      400,
      "application/problem+json"
    ));

    const dataSource = createApiGameDataSource(apiBaseUrl);

    await expect(dataSource.createSession(sessionConfig)).rejects.toThrow(
      "O número de rondas deve estar entre 1 e 10."
    );
  });

  it("falls back to the problem title when the API response has no detail", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(
      {
        title: "Sessão não encontrada.",
      },
      404,
      "application/problem+json"
    ));

    const dataSource = createApiGameDataSource(apiBaseUrl);

    await expect(dataSource.getCurrentRound("missing-session")).rejects.toThrow("Sessão não encontrada.");
  });

  it("uses a Portuguese network error when the backend cannot be reached", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const dataSource = createApiGameDataSource(apiBaseUrl);

    await expect(dataSource.getCurrentRound("session-1")).rejects.toThrow(
      "Não foi possível contactar o backend. Confirma se o modo api está ativo."
    );
  });

  it("uses a stable message when an error response cannot be parsed", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not-json", {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    }));

    const dataSource = createApiGameDataSource(apiBaseUrl);

    await expect(dataSource.getCurrentRound("session-1")).rejects.toThrow(
      "O servidor devolveu um erro, mas a resposta não pôde ser lida."
    );
  });
});
