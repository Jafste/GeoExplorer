import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleHelp,
  Clock3,
  DoorOpen,
  LockKeyhole,
  RefreshCw,
  Search,
  Shuffle,
  UsersRound,
  X,
} from "lucide-react";
import { ChallengeSceneArt } from "../../components/ChallengeSceneArt";
import { EuropeGuessMap } from "../../components/EuropeGuessMap";
import { Card } from "../../components/layout/card/card";
import { RoundTimeControl } from "../../components/RoundTimeControl";
import { AppNotice } from "../../components/ui/AppNotice";
import { ButtonBase, IconButton } from "../../components/ui/Button";
import { ModalDialog } from "../../components/ui/ModalDialog";
import { OptionGroup } from "../../components/ui/OptionGroup";
import { RoundedButton } from "../../components/ui/roundedButton";
import { TextField } from "../../components/ui/TextField";
import { appConfig, defaultSessionConfig } from "../../app/config";
import type { MultiplayerSidebarContext } from "../../app/sidebarContext";
import {
  createRandomMultiplayerDisplayName,
  getOrCreateMultiplayerPlayerId,
  MultiplayerClient,
} from "../../services/multiplayerClient";
import type {
  ChallengeRound,
  GuessCoordinates,
  MultiplayerOpenRoom,
  MultiplayerPlayer,
  MultiplayerRoomState,
  MultiplayerRoundResult,
  MultiplayerSessionResult,
  SessionConfig,
} from "../../types/game";
import { RoundMinimapDock } from "../round/components/RoundMinimapDock";
import {
  getMultiplayerPlayerStatus,
  getMultiplayerRoundResolutionLabel,
} from "./multiplayerLabels";
import {
  formatMultiplayerRoundTimer,
  getMultiplayerRoundRemainingSeconds,
} from "./multiplayerRoundTimer";
import {
  clearMultiplayerRoomResume,
  isRecoverableMultiplayerResumeError,
  readMultiplayerRoomResume,
  saveMultiplayerRoomResume,
} from "./multiplayerRoomResume";

const OPEN_ROOMS_PAGE_SIZE = 6;

interface MultiplayerPageProps {
  initialRoomCode?: string | null;
  onExitRoom: () => void;
  onPlayModeChange?: (playing: boolean) => void;
  onSidebarContextChange?: (context: MultiplayerSidebarContext | null) => void;
}

function formatOpenRoomPlayerCount(playerCount: number) {
  return `${playerCount} jogador${playerCount === 1 ? "" : "es"}`;
}

function formatOpenRoomTimer(openRoom: MultiplayerOpenRoom) {
  if (!openRoom.timed) {
    return "Sem limite";
  }

  return openRoom.roundTimeSeconds ? `${openRoom.roundTimeSeconds}s por ronda` : "Cronometrada";
}

function formatSessionTimer(config: Pick<SessionConfig, "timed" | "roundTimeSeconds">) {
  if (!config.timed) {
    return "sem limite de tempo";
  }

  return config.roundTimeSeconds ? `${config.roundTimeSeconds}s por ronda` : "rondas cronometradas";
}

function getOpenRoomSearchText(openRoom: MultiplayerOpenRoom) {
  return [
    openRoom.roomCode,
    openRoom.ownerDisplayName,
    `${openRoom.roundCount} rondas`,
    formatOpenRoomTimer(openRoom),
    formatOpenRoomPlayerCount(openRoom.playerCount),
    openRoom.hasPassword ? "protegida password" : "sem password",
  ]
    .join(" ")
    .toLowerCase();
}

export function MultiplayerPage({
  initialRoomCode,
  onExitRoom,
  onPlayModeChange,
  onSidebarContextChange,
}: MultiplayerPageProps) {
  const playerId = useMemo(() => getOrCreateMultiplayerPlayerId(), []);
  const [displayName, setDisplayName] = useState(() => {
    const generatedName = createRandomMultiplayerDisplayName();

    if (!initialRoomCode) {
      return generatedName;
    }

    return readMultiplayerRoomResume(window.localStorage, initialRoomCode)?.displayName ?? generatedName;
  });
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode?.toUpperCase() ?? "");
  const [isPublicRoom, setIsPublicRoom] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [openRooms, setOpenRooms] = useState<MultiplayerOpenRoom[]>([]);
  const [openRoomSearch, setOpenRoomSearch] = useState("");
  const [visibleOpenRoomLimit, setVisibleOpenRoomLimit] = useState(OPEN_ROOMS_PAGE_SIZE);
  const [selectedOpenRoom, setSelectedOpenRoom] = useState<MultiplayerOpenRoom | null>(null);
  const [selectedOpenRoomPassword, setSelectedOpenRoomPassword] = useState("");
  const [selectedOpenRoomError, setSelectedOpenRoomError] = useState<string | null>(null);
  const [loadingOpenRooms, setLoadingOpenRooms] = useState(false);
  const [openRoomsLoaded, setOpenRoomsLoaded] = useState(false);
  const [playerJoining, setPlayerJoining] = useState(false);
  const [config, setConfig] = useState<SessionConfig>(defaultSessionConfig);
  const [room, setRoom] = useState<MultiplayerRoomState | null>(null);
  const [currentRound, setCurrentRound] = useState<ChallengeRound | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<MultiplayerRoundResult | null>(null);
  const [finalResult, setFinalResult] = useState<MultiplayerSessionResult | null>(null);
  const [guess, setGuess] = useState<GuessCoordinates | null>(null);
  const [mapHovered, setMapHovered] = useState(false);
  const [mapPinnedOpen, setMapPinnedOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryInfo, setEntryInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cluesOpen, setCluesOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);
  const [disconnectClock, setDisconnectClock] = useState(() => Date.now());
  const [autoJoinRetryNonce, setAutoJoinRetryNonce] = useState(0);
  const [openRoomsRetryNonce, setOpenRoomsRetryNonce] = useState(0);
  const autoJoinAttemptedRef = useRef(false);
  const autoJoinRetryCountRef = useRef(0);
  const openRoomsRetryCountRef = useRef(0);
  const joinPasswordInputRef = useRef<HTMLInputElement | null>(null);
  const lastSyncedDisplayNameRef = useRef(displayName.trim());

  const client = useMemo(
    () =>
      new MultiplayerClient(appConfig.apiBaseUrl, {
        onRoomUpdated: (state) => applyRoomState(state),
        onRoundStarted: (round) => {
          setCurrentRound(round);
          setRemainingSeconds(getMultiplayerRoundRemainingSeconds(round));
          setRoundResult(null);
          setFinalResult(null);
          setGuess(null);
          setMapHovered(false);
          setMapPinnedOpen(false);
          setCluesOpen(false);
          setPlayersOpen(false);
        },
        onRoundResolved: (result) => {
          setRoundResult(result);
          setRemainingSeconds(null);
          setGuess(null);
        },
        onGameCompleted: (result) => {
          setFinalResult(result);
        },
        onOpenRoomsUpdated: (rooms) => {
          setOpenRooms(rooms);
          setOpenRoomsLoaded(true);
          setLoadingOpenRooms(false);
        },
        onPlayerSubmitted: () => undefined,
        onPlayerJoining: () => {
          setPlayerJoining(true);
          window.setTimeout(() => setPlayerJoining(false), 1800);
        },
        onError: (message) => setError(message || null),
      }),
    []
  );

  useEffect(() => {
    return () => {
      void client.stop();
    };
  }, [client]);

  const applyRoomState = (state: MultiplayerRoomState) => {
    autoJoinRetryCountRef.current = 0;
    setError(null);
    setEntryInfo(null);
    setRoom(state);
    setConfig(state.config);
    setCurrentRound(state.currentRound);
    setCluesOpen(false);
    setPlayersOpen(false);
    setRemainingSeconds(
      state.status === "playing" && state.currentRound
        ? getMultiplayerRoundRemainingSeconds(state.currentRound)
        : null
    );
    setRoundResult(state.lastRoundResult);
    setFinalResult(state.finalResult);
    setPlayerJoining(false);
    const ownPlayer = state.players.find((player) => player.playerId === playerId);
    if (ownPlayer) {
      lastSyncedDisplayNameRef.current = ownPlayer.displayName;
      setDisplayName(ownPlayer.displayName);
      saveMultiplayerRoomResume(window.localStorage, state.roomCode, ownPlayer.displayName);
    }

    const nextUrl = `${window.location.pathname}?room=${state.roomCode}`;
    window.history.replaceState(null, "", nextUrl);
  };

  const isApiMode = appConfig.dataMode === "api";
  const currentPlayer = room?.players.find((player) => player.playerId === playerId) ?? null;
  const isOwner = Boolean(currentPlayer?.isOwner);
  const hasSubmitted = Boolean(currentPlayer?.submitted);
  const hasReady = Boolean(currentPlayer?.ready);
  const disconnectedPlayers = room?.players.filter(
    (player) => !player.connected && Boolean(player.disconnectGraceEndsAt)
  ) ?? [];
  const shareUrl = room
    ? `${window.location.origin}${window.location.pathname}?room=${room.roomCode}`
    : "";
  const filteredOpenRooms = useMemo(() => {
    const query = openRoomSearch.trim().toLowerCase();

    if (!query) {
      return openRooms;
    }

    return openRooms.filter((openRoom) => getOpenRoomSearchText(openRoom).includes(query));
  }, [openRoomSearch, openRooms]);
  const visibleOpenRooms = useMemo(
    () => filteredOpenRooms.slice(0, visibleOpenRoomLimit),
    [filteredOpenRooms, visibleOpenRoomLimit]
  );
  const hiddenOpenRoomCount = Math.max(0, filteredOpenRooms.length - visibleOpenRooms.length);
  const hasMoreOpenRooms = hiddenOpenRoomCount > 0;

  useEffect(() => {
    setVisibleOpenRoomLimit(OPEN_ROOMS_PAGE_SIZE);
  }, [openRoomSearch, openRooms.length]);

  useEffect(() => {
    if (!onSidebarContextChange) {
      return;
    }

    if (!isApiMode) {
      onSidebarContextChange({
        mode: "api-required",
        config,
      });
      return;
    }

    if (!room) {
      onSidebarContextChange({
        mode: "entry",
        config,
        displayName: displayName.trim(),
        hasPassword: Boolean(roomPassword.trim()),
        isPublic: isPublicRoom,
        loadingOpenRooms,
        openRoomCount: openRooms.length,
        openRoomsLoaded,
      });
      return;
    }

    const connectedPlayerCount = room.players.filter((player) => player.connected).length;
    const latestRoundResult = roundResult ?? room.lastRoundResult;
    const ownRoundResult =
      latestRoundResult?.playerResults.find((result) => result.playerId === playerId) ?? null;
    const completedResult = finalResult ?? room.finalResult;
    const ownFinalResult =
      completedResult?.players.find((result) => result.playerId === playerId) ?? null;
    const finalRank = completedResult
      ? completedResult.players.findIndex((result) => result.playerId === playerId)
      : -1;

    onSidebarContextChange({
      mode: room.status,
      config: room.config,
      connectedPlayerCount,
      currentPlayerScore: ownFinalResult?.totalScore ?? currentPlayer?.totalScore ?? null,
      displayName: currentPlayer?.displayName ?? displayName.trim(),
      finalRank: finalRank >= 0 ? finalRank + 1 : null,
      hasPassword: room.hasPassword,
      hasReady,
      hasSubmitted,
      isOwner,
      isPublic: room.isPublic,
      latestRoundDistanceKm: ownRoundResult?.distanceKm ?? null,
      latestRoundScore: ownRoundResult?.score ?? null,
      playerCount: room.players.length,
      remainingSeconds,
      roomCode: room.roomCode,
      roundNumber:
        currentRound?.roundNumber ??
        latestRoundResult?.roundNumber ??
        completedResult?.totalRounds,
      totalRounds:
        currentRound?.totalRounds ??
        latestRoundResult?.totalRounds ??
        completedResult?.totalRounds ??
        room.config.roundCount,
    });
  }, [
    config,
    currentPlayer?.displayName,
    currentPlayer?.totalScore,
    currentRound?.roundNumber,
    currentRound?.totalRounds,
    displayName,
    finalResult,
    hasReady,
    hasSubmitted,
    isApiMode,
    isOwner,
    isPublicRoom,
    loadingOpenRooms,
    onSidebarContextChange,
    openRooms.length,
    openRoomsLoaded,
    playerId,
    remainingSeconds,
    room,
    roomPassword,
    roundResult,
  ]);

  useEffect(() => {
    return () => {
      onSidebarContextChange?.(null);
    };
  }, [onSidebarContextChange]);

  const generateDisplayName = () => {
    const generatedName = createRandomMultiplayerDisplayName();

    setDisplayName(generatedName);
    return generatedName;
  };

  const toggleMapPinnedOpen = () => {
    setMapHovered(false);
    setMapPinnedOpen((current) => !current);
  };

  useEffect(() => {
    const isPlaying = room?.status === "playing" && Boolean(currentRound);
    onPlayModeChange?.(isPlaying);
  }, [currentRound, onPlayModeChange, room?.status]);

  useEffect(() => {
    return () => {
      onPlayModeChange?.(false);
    };
  }, [onPlayModeChange]);

  useEffect(() => {
    if (!currentRound || room?.status !== "playing") {
      setRemainingSeconds(null);
      return;
    }

    setRemainingSeconds(getMultiplayerRoundRemainingSeconds(currentRound));

    if (!currentRound.timed) {
      return;
    }

    const timerId = window.setInterval(() => {
      setRemainingSeconds(getMultiplayerRoundRemainingSeconds(currentRound));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [currentRound, room?.status]);

  useEffect(() => {
    if (!isApiMode) {
      return;
    }

    let cancelled = false;
    setLoadingOpenRooms(true);

    void client.watchOpenRooms()
      .then((rooms) => {
        if (cancelled) {
          return;
        }

        openRoomsRetryCountRef.current = 0;
        setOpenRooms(rooms);
        setOpenRoomsLoaded(true);
      })
      .catch((caughtError) => {
        if (
          !cancelled &&
          isRecoverableMultiplayerResumeError(caughtError) &&
          openRoomsRetryCountRef.current < 2
        ) {
          openRoomsRetryCountRef.current += 1;
          window.setTimeout(() => {
            setOpenRoomsRetryNonce((current) => current + 1);
          }, 300);
          return;
        }

        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Não foi possível acompanhar salas abertas.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOpenRooms(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, isApiMode, openRoomsRetryNonce]);

  const getDisplayNameForAction = () => {
    const currentName = displayName.trim();

    if (currentName) {
      return currentName;
    }

    const generatedName = createRandomMultiplayerDisplayName();
    setDisplayName(generatedName);
    return generatedName;
  };

  const handleDisplayNameChange = (nextDisplayName: string) => {
    setDisplayName(nextDisplayName);
  };

  const randomizeDisplayName = () => {
    const generatedName = generateDisplayName();

    if (!room) {
      return;
    }

    void updateDisplayName(generatedName, { quiet: true });
  };

  const formatPlayerName = (name: string, targetPlayerId: string) => {
    return targetPlayerId === playerId ? `${name} (eu)` : name;
  };

  const formatDisconnectRemaining = (endsAt: string) => {
    const endTime = new Date(endsAt).getTime();
    const remainingSecondsUntilExpiry = Number.isFinite(endTime)
      ? Math.max(0, Math.ceil((endTime - disconnectClock) / 1000))
      : 0;
    const minutes = Math.floor(remainingSecondsUntilExpiry / 60);
    const seconds = remainingSecondsUntilExpiry % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDisconnectedNames = (players: MultiplayerPlayer[]) => {
    const names = players.map((player) => formatPlayerName(player.displayName, player.playerId));

    if (names.length <= 1) {
      return names[0] ?? "Um jogador";
    }

    return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
  };

  const renderPlayerStatus = (
    player: MultiplayerPlayer,
    context: "lobby" | "playing"
  ) => (
    <strong className="multiplayer-player-status">
      {getMultiplayerPlayerStatus(player, context)}
      {!player.connected && player.disconnectGraceEndsAt ? (
        <small>{formatDisconnectRemaining(player.disconnectGraceEndsAt)}</small>
      ) : null}
    </strong>
  );

  const renderDisconnectNotice = () => {
    if (disconnectedPlayers.length === 0) {
      return null;
    }

    const nextExpiry = disconnectedPlayers
      .map((player) => player.disconnectGraceEndsAt)
      .filter((endsAt): endsAt is string => Boolean(endsAt))
      .sort()[0];
    const plural = disconnectedPlayers.length > 1;
    const playerNames = formatDisconnectedNames(disconnectedPlayers);
    const remainingLabel = nextExpiry ? formatDisconnectRemaining(nextExpiry) : "00:00";

    return (
      <AppNotice
        title="Ligação em espera"
        message={`${playerNames} ${plural ? "perderam" : "perdeu"} a ligação. A sala segue automaticamente em ${remainingLabel} se ${plural ? "não voltarem" : "não voltar"}.`}
        tone="info"
      />
    );
  };

  useEffect(() => {
    const roomCode = initialRoomCode?.trim().toUpperCase() ?? "";

    if (!isApiMode || !roomCode || room || autoJoinAttemptedRef.current) {
      return;
    }

    autoJoinAttemptedRef.current = true;
    setRoomCodeInput(roomCode);

    const resume = readMultiplayerRoomResume(window.localStorage, roomCode);
    const playerName = resume?.displayName ?? getDisplayNameForAction();

    if (resume) {
      setDisplayName(resume.displayName);
    }

    setBusy(true);
    setError(null);

    void client.joinRoom(roomCode, playerId, playerName, null)
      .then(applyRoomState)
      .catch((caughtError) => {
        if (
          isRecoverableMultiplayerResumeError(caughtError) &&
          autoJoinRetryCountRef.current < 2
        ) {
          autoJoinRetryCountRef.current += 1;
          autoJoinAttemptedRef.current = false;
          setError(null);
          window.setTimeout(() => {
            setAutoJoinRetryNonce((current) => current + 1);
          }, 300);
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Não foi possível recuperar a sala.");
      })
      .finally(() => setBusy(false));
  }, [autoJoinRetryNonce, client, initialRoomCode, isApiMode, playerId, room]);

  useEffect(() => {
    if (disconnectedPlayers.length === 0) {
      return;
    }

    setDisconnectClock(Date.now());
    const timerId = window.setInterval(() => {
      setDisconnectClock(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [disconnectedPlayers.length, room?.roomCode, room?.status]);

  const createRoom = async () => {
    const playerName = getDisplayNameForAction();

    setBusy(true);
    setError(null);
    setEntryInfo(null);

    try {
      const state = await client.createRoom(
        playerId,
        playerName,
        config,
        isPublicRoom,
        roomPassword.trim() || null
      );
      applyRoomState(state);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível criar a sala.");
    } finally {
      setBusy(false);
    }
  };

  const joinRoomByCode = async (
    roomCode: string,
    password: string | null,
    options: { showGlobalError?: boolean } = {}
  ) => {
    const playerName = getDisplayNameForAction();
    const showGlobalError = options.showGlobalError ?? true;

    setBusy(true);
    if (showGlobalError) {
      setError(null);
    }
    setEntryInfo(null);

    try {
      const state = await client.joinRoom(roomCode, playerId, playerName, password);
      applyRoomState(state);
      return null;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Não foi possível entrar na sala.";
      if (showGlobalError) {
        setError(message);
      }
      return message;
    } finally {
      setBusy(false);
    }
  };

  const joinRoom = async () => {
    const roomCode = roomCodeInput.trim().toUpperCase();
    if (!roomCode) {
      setError("Indica o código da sala.");
      setEntryInfo(null);
      return;
    }

    await joinRoomByCode(roomCode, joinPassword.trim() || null);
  };

  const openJoinOpenRoomModal = (openRoom: MultiplayerOpenRoom) => {
    const roomCode = openRoom.roomCode.trim().toUpperCase();
    setRoomCodeInput(roomCode);
    setError(null);
    setEntryInfo(null);

    if (!openRoom.hasPassword) {
      setSelectedOpenRoom(null);
      setSelectedOpenRoomPassword("");
      setSelectedOpenRoomError(null);
      setJoinPassword("");
      void joinRoomByCode(roomCode, null);
      return;
    }

    setSelectedOpenRoom(openRoom);
    setSelectedOpenRoomPassword("");
    setSelectedOpenRoomError(null);
  };

  const closeJoinOpenRoomModal = () => {
    if (busy) {
      return;
    }

    setSelectedOpenRoom(null);
    setSelectedOpenRoomPassword("");
    setSelectedOpenRoomError(null);
  };

  const confirmJoinOpenRoom = async () => {
    if (!selectedOpenRoom) {
      return;
    }

    const roomCode = selectedOpenRoom.roomCode.trim().toUpperCase();
    const password = selectedOpenRoom.hasPassword ? selectedOpenRoomPassword.trim() : "";

    if (selectedOpenRoom.hasPassword && !password) {
      setSelectedOpenRoomError("Indica a password desta sala.");
      return;
    }

    setRoomCodeInput(roomCode);
    setJoinPassword(password);
    setSelectedOpenRoomError(null);

    const joinError = await joinRoomByCode(roomCode, password || null, {
      showGlobalError: false,
    });

    if (joinError) {
      setSelectedOpenRoomError(joinError);
      return;
    }

    setSelectedOpenRoom(null);
    setSelectedOpenRoomPassword("");
  };

  const loadOpenRooms = async () => {
    setLoadingOpenRooms(true);
    setError(null);
    setEntryInfo(null);

    try {
      setOpenRooms(await client.watchOpenRooms());
      setOpenRoomsLoaded(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível carregar salas abertas.");
    } finally {
      setLoadingOpenRooms(false);
    }
  };

  async function updateDisplayName(
    requestedDisplayName = displayName,
    options: { quiet?: boolean } = {}
  ) {
    if (!room) {
      return;
    }

    const playerName = requestedDisplayName.trim();

    if (playerName.length < 2 || playerName.length > 24 || playerName === lastSyncedDisplayNameRef.current) {
      return;
    }

    if (!options.quiet) {
      setError(null);
    }

    try {
      const state = await client.updateDisplayName(room.roomCode, playerId, playerName);
      lastSyncedDisplayNameRef.current = playerName;
      applyRoomState(state);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível alterar o nome.");
    }
  }

  useEffect(() => {
    if (!room) {
      return;
    }

    const playerName = displayName.trim();

    if (playerName.length < 2 || playerName.length > 24 || playerName === lastSyncedDisplayNameRef.current) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void updateDisplayName(playerName, { quiet: true });
    }, 550);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [displayName, room, updateDisplayName]);

  const renderDisplayNameField = (label: string, placeholder?: string) => (
    <TextField
      className="multiplayer-field"
      inputWrapperClassName="multiplayer-name-input-shell"
      label={label}
      maxLength={24}
      onChange={(event) => handleDisplayNameChange(event.target.value)}
      placeholder={placeholder}
      trailing={
        <IconButton
          className="multiplayer-name-random"
          disabled={busy}
          label="Gerar nome aleatório"
          onClick={randomizeDisplayName}
          title="Gerar nome aleatório"
        >
          <Shuffle size={17} strokeWidth={2.25} />
        </IconButton>
      }
      value={displayName}
    />
  );

  const renderNameEditor = () => (
    <div className="multiplayer-name-editor">
      {renderDisplayNameField("O teu nome")}
    </div>
  );

  const updateConfig = async (nextConfig: SessionConfig) => {
    if (!room || !isOwner) {
      return;
    }

    setConfig(nextConfig);
    setError(null);

    try {
      const state = await client.updateConfig(room.roomCode, playerId, nextConfig);
      applyRoomState(state);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível atualizar a sala.");
    }
  };

  const startGame = async () => {
    if (!room) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const state = await client.startGame(room.roomCode, playerId);
      applyRoomState(state);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível iniciar a partida.");
    } finally {
      setBusy(false);
    }
  };

  const submitGuess = async () => {
    if (!room || !currentRound || !guess) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const state = await client.submitGuess(room.roomCode, playerId, currentRound.id, guess);
      applyRoomState(state);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível enviar a posição.");
    } finally {
      setBusy(false);
    }
  };

  const readyForNextRound = async () => {
    if (!room) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const state = await client.readyForNextRound(room.roomCode, playerId);
      applyRoomState(state);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível avançar.");
    } finally {
      setBusy(false);
    }
  };

  const returnToLobby = async () => {
    if (!room) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const state = await client.returnToLobby(room.roomCode, playerId);
      applyRoomState(state);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível voltar à sala.");
    } finally {
      setBusy(false);
    }
  };

  const resetRoomStateToEntry = () => {
    autoJoinAttemptedRef.current = true;
    autoJoinRetryCountRef.current = 0;
    setRoom(null);
    setCurrentRound(null);
    setRemainingSeconds(null);
    setRoundResult(null);
    setFinalResult(null);
    setGuess(null);
    setMapHovered(false);
    setMapPinnedOpen(false);
    setCluesOpen(false);
    setPlayersOpen(false);
    setPlayerJoining(false);
    setCopied(false);
    setSelectedOpenRoom(null);
    setSelectedOpenRoomPassword("");
    setSelectedOpenRoomError(null);
    setRoomCodeInput("");
    setJoinPassword("");
    setError(null);
    setEntryInfo("Saíste da sala. Podes criar outra equipa ou entrar noutra sala.");
  };

  const leaveRoom = async () => {
    if (room) {
      try {
        await client.leaveRoom(room.roomCode, playerId);
      } catch {
        // Ao sair da sala, não vale a pena bloquear o regresso ao menu multiplayer por erro de rede.
      }
    }

    clearMultiplayerRoomResume(window.localStorage);
    resetRoomStateToEntry();
    onExitRoom();
  };

  const copyShareUrl = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const renderClueItems = () => {
    if (!currentRound?.challenge.clues.length) {
      return <span className="multiplayer-empty-state">Sem dicas disponíveis nesta ronda.</span>;
    }

    return currentRound.challenge.clues.map((clue) => (
      <div className="multiplayer-clue-item" key={clue.label}>
        <div>
          <span className="muted-eyebrow">{clue.label}</span>
          <strong>{clue.value}</strong>
        </div>
        <span>{clue.confidence}</span>
      </div>
    ));
  };

  if (!isApiMode) {
    return (
      <section className="screen-shell multiplayer-screen">
        <Card as="article" variant="tacticalStack">
          <span className="eyebrow">multiplayer</span>
          <h2 className="section-title">O multiplayer precisa do backend em modo api.</h2>
          <p>
            Para testar salas em tempo real, arranca o projeto com o perfil full ou com o frontend em
            modo api.
          </p>
        </Card>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="screen-shell multiplayer-screen">
        <div className="section-header section-header-inline">
          <div>
            <div className="eyebrow">multiplayer</div>
            <h2 className="section-title">Monta uma equipa ou entra por convite.</h2>
          </div>
        </div>

        {error ? (
          <AppNotice
            message={error}
            onDismiss={() => setError(null)}
            tone="danger"
          />
        ) : null}

        {entryInfo ? (
          <AppNotice
            message={entryInfo}
            onDismiss={() => setEntryInfo(null)}
            tone="info"
          />
        ) : null}

        <div className="multiplayer-entry-grid">
          <Card as="article" className="multiplayer-entry-card" variant="setupPanelStack">
            <div className="multiplayer-entry-card-header">
              <span className="muted-eyebrow">Sala</span>
            </div>
            {renderDisplayNameField("Nome na sala", "Nome gerado automaticamente")}

            <OptionGroup
              label="Visibilidade"
              options={[
                { label: "Por link", value: false },
                { label: "Sala aberta", value: true },
              ]}
              value={isPublicRoom}
              onChange={setIsPublicRoom}
            />

            <TextField
              className="multiplayer-field"
              label="Password opcional"
              maxLength={48}
              onChange={(event) => setRoomPassword(event.target.value)}
              placeholder="Deixa em branco para acesso direto"
              type="password"
              value={roomPassword}
            />

            <RoundedButton
              className="multiplayer-entry-submit"
              disabled={busy}
              intent="primary"
              radius="none"
              onClick={createRoom}
              type="button"
            >
              {busy ? "A criar..." : "Criar sala"}
            </RoundedButton>
          </Card>

          <Card as="article" className="multiplayer-entry-card" variant="setupPanelStack">
            <div className="multiplayer-entry-card-header">
              <span className="muted-eyebrow">Convite</span>
            </div>
            <h3>Entrar numa sala existente</h3>
            <p>Usa o código recebido por link. O nome tem de ser único dentro da sala.</p>
            <TextField
              className="multiplayer-field"
              label="Código da sala"
              maxLength={6}
              onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
              placeholder="ABCD12"
              value={roomCodeInput}
            />
            <TextField
              ref={joinPasswordInputRef}
              className="multiplayer-field"
              label="Password, se existir"
              maxLength={48}
              onChange={(event) => setJoinPassword(event.target.value)}
              placeholder="Opcional"
              type="password"
              value={joinPassword}
            />
            <RoundedButton
              className="multiplayer-entry-submit"
              disabled={busy}
              color="neon"
              radius="none"
              onClick={joinRoom}
              type="button"
            >
              {busy ? "A entrar..." : "Entrar na sala"}
            </RoundedButton>
          </Card>

          <Card as="article" variant="setupPanelStack" className="multiplayer-entry-card multiplayer-open-room-card">
            <div className="multiplayer-entry-card-header multiplayer-open-room-head">
              <div>
                <span className="muted-eyebrow">Salas abertas</span>
                <h3>Escolher sala aberta</h3>
              </div>
              <IconButton
                className={[
                  "multiplayer-icon-button",
                  "multiplayer-open-room-refresh",
                  loadingOpenRooms ? "is-loading" : "",
                ].filter(Boolean).join(" ")}
                disabled={loadingOpenRooms}
                label="Atualizar salas abertas"
                onClick={loadOpenRooms}
                title="Atualizar salas abertas"
              >
                <RefreshCw size={18} strokeWidth={2.2} />
              </IconButton>
            </div>
            <p>Salas no lobby sincronizadas em tempo real.</p>
            <div className="multiplayer-open-room-summary" aria-live="polite">
              <span>
                <UsersRound size={16} strokeWidth={2.2} />
                {openRooms.length} sala{openRooms.length === 1 ? "" : "s"}
              </span>
              <span>
                <Clock3 size={16} strokeWidth={2.2} />
                {loadingOpenRooms ? "A sincronizar" : "Tempo real"}
              </span>
            </div>
            <TextField
              className="multiplayer-search-shell"
              label="Pesquisar salas abertas"
              leading={<Search size={17} strokeWidth={2.2} />}
              onChange={(event) => setOpenRoomSearch(event.target.value)}
              placeholder="Pesquisar por código, dono ou ritmo"
              srOnlyLabel
              value={openRoomSearch}
            />
            <div className="multiplayer-open-room-list" aria-busy={loadingOpenRooms} aria-live="polite">
              {openRooms.length === 0 ? (
                <span className="multiplayer-empty-state">
                  {loadingOpenRooms
                    ? "A ligar à lista de salas abertas..."
                    : openRoomsLoaded
                      ? "Não há equipas abertas neste momento. Cria uma equipa aberta ou entra por link."
                      : "A preparar sincronização das salas abertas."}
                </span>
              ) : filteredOpenRooms.length === 0 ? (
                <span className="multiplayer-empty-state">
                  Nenhuma sala aberta corresponde a "{openRoomSearch.trim()}".
                </span>
              ) : (
                <>
                  <div className="multiplayer-open-room-table-head" aria-hidden="true">
                    <span>Sala</span>
                    <span>Dono</span>
                    <span>Jogadores</span>
                    <span>Rondas</span>
                    <span>Tempo</span>
                    <span />
                  </div>
                  {visibleOpenRooms.map((openRoom) => (
                    <ButtonBase
                      className="multiplayer-open-room"
                      disabled={busy || loadingOpenRooms}
                      key={openRoom.roomCode}
                      onClick={() => {
                        openJoinOpenRoomModal(openRoom);
                      }}
                    >
                      <span className="multiplayer-open-room-main">
                        <span className="multiplayer-open-room-code">Sala {openRoom.roomCode}</span>
                        {openRoom.hasPassword ? (
                          <span
                            className="multiplayer-open-room-protected"
                            aria-label="Sala protegida por password"
                            title="Protegida por password"
                          >
                            <LockKeyhole size={15} strokeWidth={2.2} />
                            Protegida
                          </span>
                        ) : null}
                      </span>
                      <span className="multiplayer-open-room-owner">Dono: {openRoom.ownerDisplayName}</span>
                      <span className="multiplayer-open-room-stat">
                        <UsersRound size={15} strokeWidth={2.2} />
                        {formatOpenRoomPlayerCount(openRoom.playerCount)}
                      </span>
                      <span className="multiplayer-open-room-stat">{openRoom.roundCount} rondas</span>
                      <span className="multiplayer-open-room-stat">
                        <Clock3 size={15} strokeWidth={2.2} />
                        {formatOpenRoomTimer(openRoom)}
                      </span>
                      <span className="multiplayer-open-room-action">Entrar</span>
                    </ButtonBase>
                  ))}
                  <div className="multiplayer-open-room-footer">
                    <span className="multiplayer-open-room-count">
                      A mostrar {visibleOpenRooms.length} de {filteredOpenRooms.length}
                      {openRoomSearch.trim() ? ` resultados` : ` salas`}
                    </span>
                    {hasMoreOpenRooms ? (
                      <RoundedButton
                        color="neon"
                        disabled={loadingOpenRooms}
                        radius="none"
                        size="sm"
                        tone="ghost"
                        type="button"
                        onClick={() =>
                          setVisibleOpenRoomLimit((current) =>
                            Math.min(current + OPEN_ROOMS_PAGE_SIZE, filteredOpenRooms.length)
                          )
                        }
                      >
                        Carregar mais {Math.min(hiddenOpenRoomCount, OPEN_ROOMS_PAGE_SIZE)}
                      </RoundedButton>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {selectedOpenRoom ? (
          <ModalDialog
            title={`Entrar na sala ${selectedOpenRoom.roomCode}`}
            onClose={closeJoinOpenRoomModal}
            footer={
              <>
                <RoundedButton
                  disabled={busy}
                  color="neon"
                  tone="ghost"
                  radius="none"
                  onClick={closeJoinOpenRoomModal}
                  type="button"
                >
                  Cancelar
                </RoundedButton>
                <RoundedButton
                  disabled={busy}
                  intent="primary"
                  radius="none"
                  onClick={() => {
                    void confirmJoinOpenRoom();
                  }}
                  type="button"
                >
                  {busy ? "A entrar..." : "Entrar"}
                </RoundedButton>
              </>
            }
          >
            {selectedOpenRoomError ? (
              <AppNotice
                message={selectedOpenRoomError}
                onDismiss={() => setSelectedOpenRoomError(null)}
                tone="danger"
              />
            ) : null}
            <div className="multiplayer-open-room-modal-summary">
              <span>
                <UsersRound size={16} strokeWidth={2.2} />
                {formatOpenRoomPlayerCount(selectedOpenRoom.playerCount)}
              </span>
              <span>{selectedOpenRoom.roundCount} rondas</span>
              <span>
                <Clock3 size={16} strokeWidth={2.2} />
                {formatOpenRoomTimer(selectedOpenRoom)}
              </span>
              {selectedOpenRoom.hasPassword ? (
                <span className="multiplayer-open-room-protected">
                  <LockKeyhole size={16} strokeWidth={2.2} />
                  Protegida
                </span>
              ) : null}
            </div>
            <p>
              {selectedOpenRoom.hasPassword ? "Esta sala aberta pede password. " : ""}
              Vais entrar como <strong>{displayName.trim() || "nome automático"}</strong> na sala de{" "}
              <strong>{selectedOpenRoom.ownerDisplayName}</strong>.
            </p>
            {selectedOpenRoom.hasPassword ? (
              <TextField
                autoFocus
                className="multiplayer-field"
                label="Password da sala"
                maxLength={48}
                onChange={(event) => setSelectedOpenRoomPassword(event.target.value)}
                placeholder="Password definida pelo dono"
                type="password"
                value={selectedOpenRoomPassword}
              />
            ) : null}
          </ModalDialog>
        ) : null}
      </section>
    );
  }

  if (room.status === "playing" && currentRound) {
    return (
      <section className="multiplayer-immersive-shell">
        <div className="multiplayer-immersive-canvas">
          <ChallengeSceneArt challenge={currentRound.challenge} />
          <div className="round-canvas-vignette" />
          <div className="round-canvas-grain" />
          <div className="round-canvas-scanline" />

          <div className="multiplayer-immersive-head">
            <div className="multiplayer-immersive-strip">
              <span className="chip chip-soft">Sala {room.roomCode}</span>
              <span className="chip chip-highlight">
                Ronda {currentRound.roundNumber}/{currentRound.totalRounds}
              </span>
              <span className={`chip ${currentRound.timed ? "chip-highlight" : "chip-soft"}`}>
                <Clock3 size={14} strokeWidth={2.1} />
                {formatMultiplayerRoundTimer(currentRound, remainingSeconds)}
              </span>
            </div>

            <div className="multiplayer-immersive-actions">
              <IconButton
                className="multiplayer-icon-button"
                label="Ver dicas"
                onClick={() => setCluesOpen(true)}
                title="Ver dicas"
              >
                <CircleHelp size={18} strokeWidth={2.2} />
              </IconButton>
              <IconButton
                aria-expanded={playersOpen}
                className={`multiplayer-icon-button${playersOpen ? " is-active" : ""}`}
                label={playersOpen ? "Esconder jogadores" : "Ver jogadores"}
                onClick={() => setPlayersOpen((current) => !current)}
                title={playersOpen ? "Esconder jogadores" : "Ver jogadores"}
              >
                <UsersRound size={18} strokeWidth={2.2} />
              </IconButton>
              <IconButton
                className="multiplayer-icon-button"
                label="Sair da sala"
                onClick={leaveRoom}
                title="Sair da sala"
              >
                <DoorOpen size={18} strokeWidth={2.2} />
              </IconButton>
            </div>
          </div>

          {error ? (
            <div className="multiplayer-immersive-notice">
              <AppNotice
                message={error}
                onDismiss={() => setError(null)}
                tone="danger"
              />
            </div>
          ) : null}

          <div className="multiplayer-immersive-disconnect">
            {renderDisconnectNotice()}
          </div>

          <RoundMinimapDock
            busy={busy || hasSubmitted}
            guess={guess}
            mapHovered={mapHovered}
            mapPinnedOpen={mapPinnedOpen}
            onGuessChange={(nextGuess) => {
              setGuess(nextGuess);
              setMapPinnedOpen(true);
            }}
            onMouseEnter={() => setMapHovered(true)}
            onMouseLeave={() => setMapHovered(false)}
            onSubmit={submitGuess}
            onTogglePinnedOpen={toggleMapPinnedOpen}
            timed={currentRound.timed}
          />

          {playersOpen ? (
            <aside className="multiplayer-players-overlay" aria-label="Jogadores da sala">
              <div className="multiplayer-players-overlay-head">
                <span className="muted-eyebrow">Jogadores</span>
                <IconButton
                  className="multiplayer-icon-button"
                  label="Esconder jogadores"
                  onClick={() => setPlayersOpen(false)}
                  title="Esconder jogadores"
                >
                  <X size={18} strokeWidth={2.2} />
                </IconButton>
              </div>
              <div className="multiplayer-player-list">
                {room.players.map((player) => (
                  <div className="multiplayer-player-row" key={player.playerId}>
                    <span>{formatPlayerName(player.displayName, player.playerId)}</span>
                    {renderPlayerStatus(player, "playing")}
                  </div>
                ))}
                {playerJoining ? (
                  <div className="multiplayer-player-row multiplayer-player-row--pending">
                    <span>Jogador a entrar...</span>
                    <strong>A ligar</strong>
                  </div>
                ) : null}
              </div>
            </aside>
          ) : null}

        {cluesOpen ? (
          <ModalDialog title="Briefing da ronda" onClose={() => setCluesOpen(false)}>
            <div className="multiplayer-clue-list">
              {renderClueItems()}
            </div>
          </ModalDialog>
        ) : null}
        </div>
      </section>
    );
  }

  if (room.status === "round-result" && roundResult) {
    const ownResult = roundResult.playerResults.find((result) => result.playerId === playerId) ?? null;
    const actual = {
      latitude: roundResult.correctLatitude,
      longitude: roundResult.correctLongitude,
      label: `${roundResult.city}, ${roundResult.country}`,
    };

    return (
      <section className="screen-shell multiplayer-screen">
        {error ? (
          <AppNotice
            message={error}
            onDismiss={() => setError(null)}
            tone="danger"
          />
        ) : null}
        {renderDisconnectNotice()}
        <div className="section-header section-header-inline">
          <div>
            <div className="eyebrow">resultado da sala {room.roomCode}</div>
            <h2 className="section-title">Posições confirmadas.</h2>
          </div>
          <RoundedButton disabled={busy || hasReady} intent="primary" radius="none" onClick={readyForNextRound} type="button">
            {roundResult.completed ? "Ver classificação final" : hasReady ? "À espera dos outros" : "Pronto para avançar"}
          </RoundedButton>
        </div>

        <div className="multiplayer-result-grid">
          <Card as="article" variant="tactical">
            <EuropeGuessMap
              actual={actual}
              allowExploration
              comparisonDistanceKm={ownResult?.distanceKm ?? null}
              disabled
              fitToMarkers
              guess={ownResult?.guess ?? null}
              showComparisonLine={Boolean(ownResult?.guess)}
              showFooter={false}
            />
          </Card>

          <Card as="article" variant="tacticalStack">
            <span className="muted-eyebrow">Ranking da ronda</span>
            <h3>{roundResult.city}, {roundResult.country}</h3>
            <div className="multiplayer-leaderboard">
              {roundResult.playerResults.map((result, index) => (
                <div className="multiplayer-leaderboard-row" key={result.playerId}>
                  <div className="multiplayer-leaderboard-copy">
                    <span>{index + 1}. {formatPlayerName(result.displayName, result.playerId)}</span>
                    <small>{getMultiplayerRoundResolutionLabel(result.resolution)}</small>
                  </div>
                  <strong>{result.score.toLocaleString("pt-PT")} pts</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    );
  }

  if (room.status === "completed" && (finalResult ?? room.finalResult)) {
    const result = (finalResult ?? room.finalResult)!;

    return (
      <section className="screen-shell multiplayer-screen">
        {error ? (
          <AppNotice
            message={error}
            onDismiss={() => setError(null)}
            tone="danger"
          />
        ) : null}
        {renderDisconnectNotice()}
        <div className="section-header section-header-inline">
          <div>
            <div className="eyebrow">fim da partida</div>
            <h2 className="section-title">Classificação final da equipa.</h2>
          </div>
          <div className="setup-header-actions">
            <RoundedButton
              disabled={!isOwner || busy}
              intent="primary"
              radius="none"
              onClick={returnToLobby}
              type="button"
            >
              {isOwner ? "Voltar à sala" : "À espera do dono"}
            </RoundedButton>
            <RoundedButton color="neon" tone="ghost" radius="none" onClick={leaveRoom} type="button">
              Sair
            </RoundedButton>
          </div>
        </div>

        <Card as="article" variant="tacticalStack">
          <div className="multiplayer-leaderboard multiplayer-leaderboard--final">
            {result.players.map((player, index) => (
              <div className="multiplayer-leaderboard-row" key={player.playerId}>
                <span>{index + 1}. {formatPlayerName(player.displayName, player.playerId)}</span>
                <strong>{player.totalScore.toLocaleString("pt-PT")} pts</strong>
              </div>
            ))}
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="screen-shell multiplayer-screen">
      {error ? (
        <AppNotice
          message={error}
          onDismiss={() => setError(null)}
          tone="danger"
        />
      ) : null}
      {renderDisconnectNotice()}
      <div className="section-header section-header-inline multiplayer-lobby-header">
        <div className="multiplayer-lobby-header-copy">
          <div className="eyebrow">sala {room.roomCode}</div>
          <h2 className="section-title">Equipa em briefing.</h2>
          <p>
            {room.isPublic ? "Sala aberta na lista pública." : "Sala privada por link."}
            {` ${room.config.roundCount} rondas · ${formatSessionTimer(room.config)}.`}
            {room.hasPassword ? " Protegida por password." : ""}
          </p>
        </div>
        <div className="setup-header-actions multiplayer-lobby-header-actions">
          <RoundedButton color="neon" tone="ghost" radius="none" onClick={copyShareUrl} type="button">
            {copied ? "Link copiado" : "Copiar link"}
          </RoundedButton>
          <RoundedButton color="neon" tone="subtle" radius="none" onClick={leaveRoom} type="button">
            Sair
          </RoundedButton>
        </div>
      </div>

      <div className="multiplayer-lobby-grid">
        <Card as="article" variant="setupPanelStack" className="multiplayer-lobby-card multiplayer-lobby-players-card">
          <span className="muted-eyebrow">Jogadores</span>
          {renderNameEditor()}
          <div className="multiplayer-player-list">
            {room.players.map((player) => (
              <div className="multiplayer-player-row" key={player.playerId}>
                <span>{formatPlayerName(player.displayName, player.playerId)}</span>
                {renderPlayerStatus(player, "lobby")}
              </div>
            ))}
            {playerJoining ? (
              <div className="multiplayer-player-row multiplayer-player-row--pending">
                <span>Jogador a entrar...</span>
                <strong>A ligar</strong>
              </div>
            ) : null}
          </div>
        </Card>

        <Card as="article" variant="setupPanelStack" className="multiplayer-lobby-card multiplayer-lobby-config-card">
          <span className="muted-eyebrow">Briefing</span>
          <OptionGroup
            label="Número de rondas"
            options={[
              { label: "3 rondas", value: 3 },
              { label: "5 rondas", value: 5 },
              { label: "7 rondas", value: 7 },
            ]}
            value={config.roundCount}
            onChange={(roundCount) => void updateConfig({ ...config, roundCount })}
          />
          <OptionGroup
            label="Modo de tempo"
            options={[
              { label: "Livre", value: false },
              { label: "Cronometrado", value: true },
            ]}
            value={config.timed}
            onChange={(timed) =>
              void updateConfig({
                ...config,
                timed,
                roundTimeSeconds: timed ? config.roundTimeSeconds ?? 60 : null,
              })
            }
          />
          {config.timed ? (
            <RoundTimeControl
              value={config.roundTimeSeconds}
              onChange={(roundTimeSeconds) => void updateConfig({ ...config, roundTimeSeconds })}
            />
          ) : null}
          <RoundedButton disabled={!isOwner || busy} intent="primary" radius="none" onClick={startGame} type="button">
            {isOwner ? "Lançar missão" : "À espera do dono da sala"}
          </RoundedButton>
        </Card>
      </div>
    </section>
  );
}
