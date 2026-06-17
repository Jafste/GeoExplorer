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
const RANDOM_DISPLAY_NAME_MOODS = [
  "Arcade",
  "Bright",
  "Cosmic",
  "Curious",
  "Glitchy",
  "Lucky",
  "Neon",
  "Rapid",
  "Sharp",
  "Silent",
  "Sneaky",
  "Solar",
  "Turbo",
  "Witty",
] as const;
const RANDOM_DISPLAY_NAME_HANDLES = [
  "Atlas",
  "Beacon",
  "Cipher",
  "Clue",
  "Compass",
  "Echo",
  "Grid",
  "Marker",
  "Meridian",
  "Orbit",
  "Parallax",
  "Pixel",
  "Quest",
  "Radar",
  "Route",
  "Signal",
  "Vector",
  "Vertex",
  "Waypoint",
  "Zoom",
] as const;

function randomIndex(maxExclusive: number) {
  const cryptoObject = globalThis.crypto;

  if (cryptoObject?.getRandomValues) {
    const values = new Uint32Array(1);
    cryptoObject.getRandomValues(values);
    return values[0] % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

function pickRandom<TValue>(values: readonly TValue[]) {
  return values[randomIndex(values.length)];
}

export function createRandomMultiplayerDisplayName(): string {
  const number = 100 + randomIndex(900);
  return `${pickRandom(RANDOM_DISPLAY_NAME_MOODS)} ${pickRandom(RANDOM_DISPLAY_NAME_HANDLES)} ${number}`;
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

export function formatMultiplayerError(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const hubExceptionMatch = error.message.match(/HubException:\s*(.+)$/);
  const message = (hubExceptionMatch?.[1] ?? error.message).trim();

  if (
    message === "Sala não encontrada." ||
    message === "Password da sala inválida."
  ) {
    return "Sala não existe ou credenciais inválidas.";
  }

  return message || fallbackMessage;
}

export function formatMultiplayerConnectionClosedMessage(
  error: Error | undefined,
  stopRequested: boolean
): string {
  if (stopRequested || !error) {
    return "";
  }

  return formatMultiplayerError(error, "Ligação ao servidor perdida. Tenta novamente.");
}

export class MultiplayerClient {
  private readonly connection: HubConnection;
  private startPromise: Promise<void> | null = null;
  private stopRequested = false;

  public constructor(apiBaseUrl: string, events: MultiplayerClientEvents) {
    this.connection = new HubConnectionBuilder()
      .withUrl(buildMultiplayerHubUrl(apiBaseUrl))
      .withAutomaticReconnect()
      .build();

    this.connection.on("roomUpdated", events.onRoomUpdated);
    this.connection.on("roundStarted", events.onRoundStarted);
    this.connection.on("roundResolved", events.onRoundResolved);
    this.connection.on("gameCompleted", events.onGameCompleted);
    this.connection.on("openRoomsUpdated", events.onOpenRoomsUpdated);
    this.connection.on("playerSubmitted", events.onPlayerSubmitted);
    this.connection.on("playerJoining", events.onPlayerJoining);
    this.connection.on("roomError", (message) => events.onError(formatMultiplayerError(new Error(message), message)));
    this.connection.onreconnecting(() => events.onError("Ligação à sala interrompida. A tentar ligar novamente."));
    this.connection.onreconnected(() => events.onError(""));
    this.connection.onclose((error) => {
      const message = formatMultiplayerConnectionClosedMessage(error, this.stopRequested);
      this.stopRequested = false;

      if (message) {
        events.onError(message);
      }
    });
  }

  public async start(): Promise<void> {
    if (this.connection.state === HubConnectionState.Connected) {
      return;
    }

    if (this.startPromise) {
      await this.startPromise;
      return;
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      this.startPromise = this.connection.start().finally(() => {
        this.startPromise = null;
      });
      await this.startPromise;
      return;
    }

    await this.waitUntilConnectedOrDisconnected();

    const stateAfterWait = this.connection.state as HubConnectionState;
    if (stateAfterWait === HubConnectionState.Disconnected) {
      await this.start();
    }
  }

  public async stop(): Promise<void> {
    this.stopRequested = true;

    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        this.stopRequested = false;
        return;
      }
    }

    if (this.connection.state !== HubConnectionState.Disconnected) {
      await this.connection.stop();
      return;
    }

    this.stopRequested = false;
  }

  public async createRoom(
    playerId: string,
    displayName: string,
    config: SessionConfig,
    isPublic: boolean,
    password: string | null
  ): Promise<MultiplayerRoomState> {
    await this.start();
    return this.invoke<MultiplayerRoomState>("CreateRoom", {
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
    try {
      await this.announceJoining(roomCode, playerId);
    } catch {
      // This is only a presence hint. JoinRoom performs the authoritative validation.
    }

    return this.invoke<MultiplayerRoomState>("JoinRoom", {
      roomCode,
      playerId,
      displayName,
      password,
    });
  }

  public async listOpenRooms(): Promise<MultiplayerOpenRoom[]> {
    await this.start();
    return this.invoke<MultiplayerOpenRoom[]>("ListOpenRooms");
  }

  public async watchOpenRooms(): Promise<MultiplayerOpenRoom[]> {
    await this.start();
    return this.invoke<MultiplayerOpenRoom[]>("WatchOpenRooms");
  }

  public async announceJoining(roomCode: string, playerId: string): Promise<void> {
    await this.start();
    await this.invoke("AnnounceJoining", {
      roomCode,
      playerId,
    });
  }

  public async updateConfig(
    roomCode: string,
    playerId: string,
    config: SessionConfig
  ): Promise<MultiplayerRoomState> {
    return this.invoke<MultiplayerRoomState>("UpdateConfig", {
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
    return this.invoke<MultiplayerRoomState>("UpdateDisplayName", {
      roomCode,
      playerId,
      displayName,
    });
  }

  public async startGame(roomCode: string, playerId: string): Promise<MultiplayerRoomState> {
    return this.invoke<MultiplayerRoomState>("StartGame", {
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
    return this.invoke<MultiplayerRoomState>("SubmitGuess", {
      roomCode,
      playerId,
      roundId,
      guess,
    });
  }

  public async readyForNextRound(roomCode: string, playerId: string): Promise<MultiplayerRoomState> {
    return this.invoke<MultiplayerRoomState>("ReadyForNextRound", {
      roomCode,
      playerId,
    });
  }

  public async returnToLobby(roomCode: string, playerId: string): Promise<MultiplayerRoomState> {
    return this.invoke<MultiplayerRoomState>("ReturnToLobby", {
      roomCode,
      playerId,
    });
  }

  public async leaveRoom(roomCode: string, playerId: string): Promise<MultiplayerRoomState> {
    return this.invoke<MultiplayerRoomState>("LeaveRoom", {
      roomCode,
      playerId,
    });
  }

  private async invoke<T>(methodName: string, ...args: unknown[]): Promise<T> {
    try {
      if (this.connection.state !== HubConnectionState.Connected) {
        await this.start();
      }

      return await this.connection.invoke<T>(methodName, ...args);
    } catch (error) {
      throw new Error(formatMultiplayerError(error, "Não foi possível completar a ação."));
    }
  }

  private async waitUntilConnectedOrDisconnected(): Promise<void> {
    const deadline = Date.now() + 3000;

    while (
      this.connection.state !== HubConnectionState.Connected &&
      this.connection.state !== HubConnectionState.Disconnected &&
      Date.now() < deadline
    ) {
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
  }
}

export type {
  ChallengeRound,
  MultiplayerOpenRoom,
  MultiplayerRoomState,
  MultiplayerRoundResult,
  MultiplayerSessionResult,
};
