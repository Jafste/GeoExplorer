export type DataMode = "mock" | "api";

export type Confidence = "Alta" | "Média" | "Baixa";

export interface ChallengeClue {
  label: string;
  value: string;
  confidence: Confidence;
}

export interface ChallengeMedia {
  sourceProvider: string;
  imageUrl?: string;
  imageSourceUrl?: string;
  imageAttribution?: string;
  imageLicense?: string;
  imageLicenseUrl?: string;
  streetViewProvider?: string;
  streetViewUrl?: string;
  verifiedAt?: string;
}

export interface SeedLocation {
  id: string;
  title: string;
  city: string;
  country: string;
  region: string;
  category: string;
  latitude: number;
  longitude: number;
  sceneLabel: string;
  sceneNote: string;
  sceneImage?: string;
  prompt: string;
  visualGradient: [string, string, string];
  media?: ChallengeMedia;
  visualSources?: ChallengeMedia[];
  clues: ChallengeClue[];
}

export interface ChallengeRound {
  id: string;
  roundNumber: number;
  totalRounds: number;
  timed: boolean;
  timeLimitSeconds: number | null;
  endsAt?: string | null;
  challenge: Omit<SeedLocation, "latitude" | "longitude" | "region">;
}

export interface SessionConfig {
  region: "europe";
  roundCount: number;
  timed: boolean;
  roundTimeSeconds: number | null;
}

export interface GuessCoordinates {
  latitude: number;
  longitude: number;
  label: string;
}

export interface RoundProgress {
  completed: boolean;
  nextRoundNumber: number | null;
}

export interface RoundResult {
  roundId: string;
  roundNumber: number;
  title: string;
  city: string;
  country: string;
  correctLatitude: number;
  correctLongitude: number;
  guess: GuessCoordinates | null;
  score: number;
  distanceKm: number | null;
  resolution: "manual" | "timeout";
  timed: boolean;
  media?: ChallengeMedia;
  visualSources?: ChallengeMedia[];
  clues: ChallengeClue[];
}

export interface SessionResult {
  sessionId: string;
  totalScore: number;
  totalRounds: number;
  timed: boolean;
  roundTimeSeconds: number | null;
  rounds: RoundResult[];
}

export interface CreateSessionResponse {
  sessionId: string;
  currentRound: ChallengeRound;
}

export interface RoundResolutionResponse {
  result: RoundResult;
  progress: RoundProgress;
}

export type MultiplayerRoomStatus = "lobby" | "playing" | "round-result" | "completed";

export interface MultiplayerPlayer {
  playerId: string;
  displayName: string;
  isOwner: boolean;
  connected: boolean;
  disconnectGraceEndsAt: string | null;
  submitted: boolean;
  ready: boolean;
  totalScore: number;
}

export interface MultiplayerRoomState {
  roomCode: string;
  status: MultiplayerRoomStatus;
  ownerPlayerId: string;
  isPublic: boolean;
  hasPassword: boolean;
  config: SessionConfig;
  players: MultiplayerPlayer[];
  currentRound: ChallengeRound | null;
  lastRoundResult: MultiplayerRoundResult | null;
  finalResult: MultiplayerSessionResult | null;
}

export interface MultiplayerOpenRoom {
  roomCode: string;
  ownerDisplayName: string;
  playerCount: number;
  roundCount: number;
  timed: boolean;
  roundTimeSeconds: number | null;
  hasPassword: boolean;
}

export interface MultiplayerPlayerRoundResult {
  playerId: string;
  displayName: string;
  guess: GuessCoordinates | null;
  score: number;
  distanceKm: number | null;
  resolution: "manual" | "timeout" | "missing" | "disconnect";
}

export interface MultiplayerRoundResult {
  roomCode: string;
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  title: string;
  city: string;
  country: string;
  correctLatitude: number;
  correctLongitude: number;
  media?: ChallengeMedia;
  visualSources?: ChallengeMedia[];
  clues: ChallengeClue[];
  playerResults: MultiplayerPlayerRoundResult[];
  completed: boolean;
  nextRoundNumber: number | null;
}

export interface MultiplayerSessionPlayerResult {
  playerId: string;
  displayName: string;
  totalScore: number;
}

export interface MultiplayerSessionResult {
  roomCode: string;
  totalRounds: number;
  players: MultiplayerSessionPlayerResult[];
  rounds: MultiplayerRoundResult[];
}

export interface MultiplayerClientEvents {
  onRoomUpdated: (state: MultiplayerRoomState) => void;
  onRoundStarted: (round: ChallengeRound) => void;
  onRoundResolved: (result: MultiplayerRoundResult) => void;
  onGameCompleted: (result: MultiplayerSessionResult) => void;
  onOpenRoomsUpdated: (rooms: MultiplayerOpenRoom[]) => void;
  onPlayerSubmitted: (playerId: string) => void;
  onPlayerJoining: () => void;
  onError: (message: string) => void;
}

export interface GameDataSource {
  createSession(config: SessionConfig): Promise<CreateSessionResponse>;
  getCurrentRound(sessionId: string): Promise<ChallengeRound>;
  submitGuess(
    sessionId: string,
    roundId: string,
    guess: GuessCoordinates
  ): Promise<RoundResolutionResponse>;
  timeoutRound(
    sessionId: string,
    roundId: string,
    guess: GuessCoordinates | null
  ): Promise<RoundResolutionResponse>;
  getSessionResults(sessionId: string): Promise<SessionResult>;
}
