import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import type {
  ChallengeRound,
  GuessCoordinates,
  MultiplayerClientEvents,
  MultiplayerOpenRoom,
  MultiplayerRoomState,
  MultiplayerRoundResult,
  MultiplayerSessionResult,
  SessionConfig,
} from "../types/game";

const PLAYER_ID_STORAGE_KEY = "geoexplorer.multiplayer.playerId";
const RANDOM_NAME_ADJECTIVES = ["Norte", "Bravo", "Rápido", "Sereno", "Atento", "Livre"];
const RANDOM_NAME_NOUNS = ["Explorador", "Viajante", "Cartógrafo", "Guia", "Piloto", "Batedor"];

export function createRandomMultiplayerDisplayName(): string {
  const adjective = RANDOM_NAME_ADJECTIVES[Math.floor(Math.random() * RANDOM_NAME_ADJECTIVES.length)];
  const noun = RANDOM_NAME_NOUNS[Math.floor(Math.random() * RANDOM_NAME_NOUNS.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${noun} ${adjective} ${suffix}`;
}

export function getOrCreateMultiplayerPlayerId(): string {
  const existing = window.localStorage.getItem(PLAYER_ID_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const nextId = globalThis.crypto?.randomUUID?.() ?? `player-${Date.now()}-${Math.random()}`;
  window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, nextId);
  return nextId;
}

export function buildMultiplayerHubUrl(apiBaseUrl: string): string {
  const trimmed = apiBaseUrl.replace(/\/$/, "");

  if (trimmed.endsWith("/api")) {
    return `${trimmed.slice(0, -4)}/hubs/multiplayer`;
  }

  return `${trimmed}/hubs/multiplayer`;
}

export class MultiplayerClient {
  private readonly connection: HubConnection;

  public constructor(apiBaseUrl: string, events: MultiplayerClientEvents) {
    this.connection = new HubConnectionBuilder()
      .withUrl(buildMultiplayerHubUrl(apiBaseUrl))
      .withAutomaticReconnect()
      .build();

    this.connection.on("roomUpdated", events.onRoomUpdated);
    this.connection.on("roundStarted", events.onRoundStarted);
    this.connection.on("roundResolved", events.onRoundResolved);
    this.connection.on("gameCompleted", events.onGameCompleted);
    this.connection.on("playerSubmitted", events.onPlayerSubmitted);
    this.connection.on("playerJoining", events.onPlayerJoining);
    this.connection.on("roomError", events.onError);
    this.connection.onreconnecting(() => events.onError("Ligação à sala interrompida. A tentar ligar novamente."));
    this.connection.onreconnected(() => events.onError(""));
    this.connection.onclose(() => events.onError("A ligação à sala foi fechada."));
  }

  public async start(): Promise<void> {
    if (this.connection.state === HubConnectionState.Disconnected) {
      await this.connection.start();
    }
  }

  public async stop(): Promise<void> {
    if (this.connection.state !== HubConnectionState.Disconnected) {
      await this.connection.stop();
    }
  }

  public async createRoom(
    playerId: string,
    displayName: string,
    config: SessionConfig,
    isPublic: boolean,
    password: string | null
  ): Promise<MultiplayerRoomState> {
    await this.start();
    return this.connection.invoke<MultiplayerRoomState>("CreateRoom", {
      playerId,
      displayName,
      config,
      isPublic,
      password,
    });
  }

  public async joinRoom(
    roomCode: string,
    playerId: string,
    displayName: string,
    password: string | null
  ): Promise<MultiplayerRoomState> {
    await this.start();
    await this.announceJoining(roomCode, playerId);
    return this.connection.invoke<MultiplayerRoomState>("JoinRoom", {
      roomCode,
      playerId,
      displayName,
      password,
    });
  }

  public async listOpenRooms(): Promise<MultiplayerOpenRoom[]> {
    await this.start();
    return this.connection.invoke<MultiplayerOpenRoom[]>("ListOpenRooms");
  }

  public async announceJoining(roomCode: string, playerId: string): Promise<void> {
    await this.start();
    await this.connection.invoke("AnnounceJoining", {
      roomCode,
      playerId,
    });
  }

  public async updateConfig(
    roomCode: string,
    playerId: string,
    config: SessionConfig
  ): Promise<MultiplayerRoomState> {
    return this.connection.invoke<MultiplayerRoomState>("UpdateConfig", {
      roomCode,
      playerId,
      config,
    });
  }

  public async updateDisplayName(
    roomCode: string,
    playerId: string,
    displayName: string
  ): Promise<MultiplayerRoomState> {
    return this.connection.invoke<MultiplayerRoomState>("UpdateDisplayName", {
      roomCode,
      playerId,
      displayName,
    });
  }

  public async startGame(roomCode: string, playerId: string): Promise<MultiplayerRoomState> {
    return this.connection.invoke<MultiplayerRoomState>("StartGame", {
      roomCode,
      playerId,
    });
  }

  public async submitGuess(
    roomCode: string,
    playerId: string,
    roundId: string,
    guess: GuessCoordinates
  ): Promise<MultiplayerRoomState> {
    return this.connection.invoke<MultiplayerRoomState>("SubmitGuess", {
      roomCode,
      playerId,
      roundId,
      guess,
    });
  }

  public async readyForNextRound(roomCode: string, playerId: string): Promise<MultiplayerRoomState> {
    return this.connection.invoke<MultiplayerRoomState>("ReadyForNextRound", {
      roomCode,
      playerId,
    });
  }

  public async leaveRoom(roomCode: string, playerId: string): Promise<MultiplayerRoomState> {
    return this.connection.invoke<MultiplayerRoomState>("LeaveRoom", {
      roomCode,
      playerId,
    });
  }
}

export type {
  ChallengeRound,
  MultiplayerOpenRoom,
  MultiplayerRoomState,
  MultiplayerRoundResult,
  MultiplayerSessionResult,
};
