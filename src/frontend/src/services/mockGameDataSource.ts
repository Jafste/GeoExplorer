import { mockLocations } from "../data/mockLocations";
import type {
  ChallengeRound,
  CreateSessionResponse,
  GameDataSource,
  GuessCoordinates,
  RoundResolutionResponse,
  RoundResult,
  SeedLocation,
  SessionConfig,
  SessionResult,
} from "../types/game";

interface StoredRound {
  id: string;
  roundNumber: number;
  location: SeedLocation;
  result: RoundResult | null;
}

interface StoredSession {
  id: string;
  config: SessionConfig;
  rounds: StoredRound[];
  currentRoundIndex: number;
}

const sessions = new Map<string, StoredSession>();
let sessionCounter = 0;

const EUROPE_BOUNDS = {
  minLat: 34,
  maxLat: 72,
  minLng: -25,
  maxLng: 45,
};

function buildRound(round: StoredRound, session: StoredSession): ChallengeRound {
  const { latitude: _latitude, longitude: _longitude, region: _region, ...challenge } = round.location;

  return {
    id: round.id,
    roundNumber: round.roundNumber,
    totalRounds: session.rounds.length,
    timed: session.config.timed,
    timeLimitSeconds: session.config.timed ? session.config.roundTimeSeconds : null,
    challenge,
  };
}

function haversineDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(latitudeB - latitudeA);
  const deltaLng = toRadians(longitudeB - longitudeA);
  const latA = toRadians(latitudeA);
  const latB = toRadians(latitudeB);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function scoreFromDistance(distanceKm: number): number {
  return Math.max(0, Math.round(5000 * Math.exp(-distanceKm / 650)));
}

function clampGuess(guess: GuessCoordinates): GuessCoordinates {
  return {
    ...guess,
    latitude: Math.min(EUROPE_BOUNDS.maxLat, Math.max(EUROPE_BOUNDS.minLat, guess.latitude)),
    longitude: Math.min(EUROPE_BOUNDS.maxLng, Math.max(EUROPE_BOUNDS.minLng, guess.longitude)),
  };
}

function createResolution(
  session: StoredSession,
  round: StoredRound,
  guess: GuessCoordinates | null,
  resolution: "manual" | "timeout"
): RoundResolutionResponse {
  const normalizedGuess = guess ? clampGuess(guess) : null;
  const distanceKm =
    normalizedGuess === null
      ? null
      : haversineDistanceKm(
          normalizedGuess.latitude,
          normalizedGuess.longitude,
          round.location.latitude,
          round.location.longitude
        );

  const result: RoundResult = {
    roundId: round.id,
    roundNumber: round.roundNumber,
    title: round.location.title,
    city: round.location.city,
    country: round.location.country,
    correctLatitude: round.location.latitude,
    correctLongitude: round.location.longitude,
    guess: normalizedGuess,
    score: distanceKm === null ? 0 : scoreFromDistance(distanceKm),
    distanceKm,
    resolution,
    timed: session.config.timed,
    clues: round.location.clues,
  };

  round.result = result;
  session.currentRoundIndex += 1;

  return {
    result,
    progress: {
      completed: session.currentRoundIndex >= session.rounds.length,
      nextRoundNumber:
        session.currentRoundIndex >= session.rounds.length
          ? null
          : session.rounds[session.currentRoundIndex].roundNumber,
    },
  };
}

function getSession(sessionId: string): StoredSession {
  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error("Sessão não encontrada.");
  }

  return session;
}

function getPendingRound(session: StoredSession, roundId: string): StoredRound {
  const pending = session.rounds.find((round) => round.id === roundId);

  if (!pending) {
    throw new Error("Ronda não encontrada.");
  }

  if (pending.result !== null) {
    throw new Error("A ronda já foi resolvida.");
  }

  return pending;
}

export function createMockGameDataSource(): GameDataSource {
  return {
    async createSession(config: SessionConfig): Promise<CreateSessionResponse> {
      sessionCounter += 1;
      const sessionId = `mock-session-${sessionCounter}`;
      const offset = (sessionCounter - 1) % mockLocations.length;
      const selectedLocations = Array.from({ length: config.roundCount }, (_, index) => {
        return mockLocations[(offset + index) % mockLocations.length];
      });

      const rounds: StoredRound[] = selectedLocations.map((location, index) => ({
        id: `${sessionId}-round-${index + 1}`,
        roundNumber: index + 1,
        location,
        result: null,
      }));

      const session: StoredSession = {
        id: sessionId,
        config,
        rounds,
        currentRoundIndex: 0,
      };

      sessions.set(sessionId, session);

      return {
        sessionId,
        currentRound: buildRound(rounds[0], session),
      };
    },

    async getCurrentRound(sessionId: string): Promise<ChallengeRound> {
      const session = getSession(sessionId);
      const currentRound = session.rounds[session.currentRoundIndex];

      if (!currentRound) {
        throw new Error("A sessão já terminou.");
      }

      return buildRound(currentRound, session);
    },

    async submitGuess(
      sessionId: string,
      roundId: string,
      guess: GuessCoordinates
    ): Promise<RoundResolutionResponse> {
      const session = getSession(sessionId);
      const round = getPendingRound(session, roundId);
      return createResolution(session, round, guess, "manual");
    },

    async timeoutRound(
      sessionId: string,
      roundId: string,
      guess: GuessCoordinates | null
    ): Promise<RoundResolutionResponse> {
      const session = getSession(sessionId);
      const round = getPendingRound(session, roundId);
      return createResolution(session, round, guess, "timeout");
    },

    async getSessionResults(sessionId: string): Promise<SessionResult> {
      const session = getSession(sessionId);

      return {
        sessionId: session.id,
        totalScore: session.rounds.reduce((sum, round) => sum + (round.result?.score ?? 0), 0),
        totalRounds: session.rounds.length,
        timed: session.config.timed,
        roundTimeSeconds: session.config.roundTimeSeconds,
        rounds: session.rounds
          .map((round) => round.result)
          .filter((result): result is RoundResult => result !== null),
      };
    },
  };
}
