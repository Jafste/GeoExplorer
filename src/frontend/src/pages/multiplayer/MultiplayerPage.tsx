import { useEffect, useMemo, useRef, useState } from "react";
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
  MultiplayerRoomState,
  MultiplayerRoundResult,
  MultiplayerSessionResult,
  SessionConfig,
} from "../../types/game";
import { getOpenRoomSearchText } from "./multiplayerFormat";
import {
  getMultiplayerRoundRemainingSeconds,
} from "./multiplayerRoundTimer";
import {
  clearMultiplayerRoomResume,
  isRecoverableMultiplayerResumeError,
  readMultiplayerRoomResume,
  saveMultiplayerRoomResume,
} from "./multiplayerRoomResume";
import { buildMultiplayerSidebarContext } from "./multiplayerSidebarContext";
import { MultiplayerApiRequiredView, MultiplayerEntryView } from "./MultiplayerEntryView";
import { MultiplayerLobbyView } from "./MultiplayerLobbyView";
import { MultiplayerPlayingView } from "./MultiplayerPlayingView";
import { MultiplayerCompletedView, MultiplayerRoundResultView } from "./MultiplayerResultViews";

const OPEN_ROOMS_PAGE_SIZE = 6;

interface MultiplayerPageProps {
  initialRoomCode?: string | null;
  onExitRoom: () => void;
  onPlayModeChange?: (playing: boolean) => void;
  onSidebarContextChange?: (context: MultiplayerSidebarContext | null) => void;
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

    onSidebarContextChange(buildMultiplayerSidebarContext({
      config,
      currentPlayer,
      currentRound,
      displayName,
      finalResult,
      hasReady,
      hasSubmitted,
      isApiMode,
      isOwner,
      isPublicRoom,
      loadingOpenRooms,
      openRoomCount: openRooms.length,
      openRoomsLoaded,
      playerId,
      remainingSeconds,
      room,
      roomPassword,
      roundResult,
    }));
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
    const generatedName = createRandomMultiplayerDisplayName();
    setDisplayName(generatedName);

    if (!room) {
      return;
    }

    void updateDisplayName(generatedName, { quiet: true });
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
      setOpenRooms(await client.listOpenRooms());
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

  const applyRoomAction = async (
    action: (activeRoom: MultiplayerRoomState) => Promise<MultiplayerRoomState>,
    fallbackError: string
  ) => {
    if (!room) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      applyRoomState(await action(room));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : fallbackError);
    } finally {
      setBusy(false);
    }
  };

  const startGame = () =>
    applyRoomAction(
      (activeRoom) => client.startGame(activeRoom.roomCode, playerId),
      "Não foi possível iniciar a partida."
    );

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

  const readyForNextRound = () =>
    applyRoomAction(
      (activeRoom) => client.readyForNextRound(activeRoom.roomCode, playerId),
      "Não foi possível avançar."
    );

  const returnToLobby = () =>
    applyRoomAction(
      (activeRoom) => client.returnToLobby(activeRoom.roomCode, playerId),
      "Não foi possível voltar à sala."
    );

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
      await client.leaveRoom(room.roomCode, playerId).catch(() => undefined);
    }

    clearMultiplayerRoomResume(window.localStorage);
    resetRoomStateToEntry();
    onExitRoom();
  };

  const copyShareUrl = async () => {
    if (!shareUrl || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Não foi possível copiar o link.");
    }
  };

  if (!isApiMode) {
    return <MultiplayerApiRequiredView />;
  }

  if (!room) {
    return (
      <MultiplayerEntryView
        busy={busy}
        displayName={displayName}
        entryInfo={entryInfo}
        error={error}
        filteredOpenRooms={filteredOpenRooms}
        hasMoreOpenRooms={hasMoreOpenRooms}
        hiddenOpenRoomCount={hiddenOpenRoomCount}
        isPublicRoom={isPublicRoom}
        joinPassword={joinPassword}
        joinPasswordInputRef={joinPasswordInputRef}
        loadingOpenRooms={loadingOpenRooms}
        onCloseJoinOpenRoomModal={closeJoinOpenRoomModal}
        onConfirmJoinOpenRoom={() => {
          void confirmJoinOpenRoom();
        }}
        onCreateRoom={() => {
          void createRoom();
        }}
        onDismissEntryInfo={() => setEntryInfo(null)}
        onDismissError={() => setError(null)}
        onDismissSelectedOpenRoomError={() => setSelectedOpenRoomError(null)}
        onDisplayNameChange={handleDisplayNameChange}
        onJoinOpenRoom={openJoinOpenRoomModal}
        onJoinPasswordChange={setJoinPassword}
        onJoinRoom={() => {
          void joinRoom();
        }}
        onLoadMoreOpenRooms={() =>
          setVisibleOpenRoomLimit((current) =>
            Math.min(current + OPEN_ROOMS_PAGE_SIZE, filteredOpenRooms.length)
          )
        }
        onLoadOpenRooms={() => {
          void loadOpenRooms();
        }}
        onOpenRoomSearchChange={setOpenRoomSearch}
        onPublicRoomChange={setIsPublicRoom}
        onRandomizeDisplayName={randomizeDisplayName}
        onRoomCodeInputChange={setRoomCodeInput}
        onRoomPasswordChange={setRoomPassword}
        onSelectedOpenRoomPasswordChange={setSelectedOpenRoomPassword}
        openRoomSearch={openRoomSearch}
        openRooms={openRooms}
        openRoomsLoaded={openRoomsLoaded}
        openRoomsPageSize={OPEN_ROOMS_PAGE_SIZE}
        roomCodeInput={roomCodeInput}
        roomPassword={roomPassword}
        selectedOpenRoom={selectedOpenRoom}
        selectedOpenRoomError={selectedOpenRoomError}
        selectedOpenRoomPassword={selectedOpenRoomPassword}
        visibleOpenRooms={visibleOpenRooms}
      />
    );
  }

  if (room.status === "playing" && currentRound) {
    return (
      <MultiplayerPlayingView
        busy={busy}
        cluesOpen={cluesOpen}
        currentRound={currentRound}
        currentPlayerId={playerId}
        disconnectedPlayers={disconnectedPlayers}
        disconnectClock={disconnectClock}
        error={error}
        guess={guess}
        hasSubmitted={hasSubmitted}
        mapHovered={mapHovered}
        mapPinnedOpen={mapPinnedOpen}
        onCloseClues={() => setCluesOpen(false)}
        onClosePlayers={() => setPlayersOpen(false)}
        onDismissError={() => setError(null)}
        onGuessChange={(nextGuess) => {
          setGuess(nextGuess);
          setMapPinnedOpen(true);
        }}
        onLeaveRoom={() => {
          void leaveRoom();
        }}
        onMouseEnterMap={() => setMapHovered(true)}
        onMouseLeaveMap={() => setMapHovered(false)}
        onOpenClues={() => setCluesOpen(true)}
        onSubmitGuess={submitGuess}
        onToggleMapPinnedOpen={toggleMapPinnedOpen}
        onTogglePlayers={() => setPlayersOpen((current) => !current)}
        playerJoining={playerJoining}
        playersOpen={playersOpen}
        remainingSeconds={remainingSeconds}
        room={room}
      />
    );
  }

  if (room.status === "round-result" && roundResult) {
    return (
      <MultiplayerRoundResultView
        busy={busy}
        currentPlayerId={playerId}
        disconnectedPlayers={disconnectedPlayers}
        disconnectClock={disconnectClock}
        error={error}
        hasReady={hasReady}
        onDismissError={() => setError(null)}
        onReadyForNextRound={() => {
          void readyForNextRound();
        }}
        playerId={playerId}
        room={room}
        roundResult={roundResult}
      />
    );
  }

  const completedResult = finalResult ?? room.finalResult;

  if (room.status === "completed" && completedResult) {
    return (
      <MultiplayerCompletedView
        busy={busy}
        currentPlayerId={playerId}
        disconnectedPlayers={disconnectedPlayers}
        disconnectClock={disconnectClock}
        error={error}
        isOwner={isOwner}
        onDismissError={() => setError(null)}
        onLeaveRoom={() => {
          void leaveRoom();
        }}
        onReturnToLobby={() => {
          void returnToLobby();
        }}
        result={completedResult}
      />
    );
  }

  return (
    <MultiplayerLobbyView
      busy={busy}
      config={config}
      copied={copied}
      currentPlayerId={playerId}
      disconnectedPlayers={disconnectedPlayers}
      disconnectClock={disconnectClock}
      displayName={displayName}
      error={error}
      isOwner={isOwner}
      onCopyShareUrl={() => {
        void copyShareUrl();
      }}
      onDismissError={() => setError(null)}
      onDisplayNameChange={handleDisplayNameChange}
      onLeaveRoom={() => {
        void leaveRoom();
      }}
      onRandomizeDisplayName={randomizeDisplayName}
      onStartGame={() => {
        void startGame();
      }}
      onUpdateConfig={(nextConfig) => {
        void updateConfig(nextConfig);
      }}
      playerJoining={playerJoining}
      room={room}
    />
  );

}
