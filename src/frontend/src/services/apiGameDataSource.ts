import type {
  ChallengeRound,
  CreateSessionResponse,
  GameDataSource,
  GuessCoordinates,
  RoundResolutionResponse,
  SessionConfig,
  SessionResult,
} from "../types/game";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "O servidor devolveu um erro.");
  }

  return (await response.json()) as T;
}

export function createApiGameDataSource(apiBaseUrl: string): GameDataSource {
  return {
    createSession(config: SessionConfig): Promise<CreateSessionResponse> {
      return requestJson<CreateSessionResponse>(`${apiBaseUrl}/sessions`, {
        method: "POST",
        body: JSON.stringify(config),
      });
    },

    getCurrentRound(sessionId: string): Promise<ChallengeRound> {
      return requestJson<ChallengeRound>(`${apiBaseUrl}/sessions/${sessionId}/current-round`);
    },

    submitGuess(
      sessionId: string,
      roundId: string,
      guess: GuessCoordinates
    ): Promise<RoundResolutionResponse> {
      return requestJson<RoundResolutionResponse>(
        `${apiBaseUrl}/sessions/${sessionId}/rounds/${roundId}/guess`,
        {
          method: "POST",
          body: JSON.stringify({ guess }),
        }
      );
    },

    timeoutRound(
      sessionId: string,
      roundId: string,
      guess: GuessCoordinates | null
    ): Promise<RoundResolutionResponse> {
      return requestJson<RoundResolutionResponse>(
        `${apiBaseUrl}/sessions/${sessionId}/rounds/${roundId}/timeout`,
        {
          method: "POST",
          body: JSON.stringify({ guess }),
        }
      );
    },

    getSessionResults(sessionId: string): Promise<SessionResult> {
      return requestJson<SessionResult>(`${apiBaseUrl}/sessions/${sessionId}/results`);
    },
  };
}
