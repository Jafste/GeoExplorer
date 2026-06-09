import { useEffect, useMemo, useRef, useState } from "react";
import { CircleHelp, Clock3, X } from "lucide-react";
import { ChallengeSceneArt } from "../../components/ChallengeSceneArt";
import { EuropeGuessMap } from "../../components/EuropeGuessMap";
import { Card } from "../../components/layout/card/card";
import { AppNotice } from "../../components/ui/AppNotice";
import { OptionGroup } from "../../components/ui/OptionGroup";
import { RoundedButton } from "../../components/ui/roundedButton";
import { appConfig, defaultSessionConfig } from "../../app/config";
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

interface MultiplayerPageProps {
  initialRoomCode?: string | null;
  onBack: () => void;
}

export function MultiplayerPage({ initialRoomCode, onBack }: MultiplayerPageProps) {
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cluesOpen, setCluesOpen] = useState(false);
  const [disconnectClock, setDisconnectClock] = useState(() => Date.now());
  const [autoJoinRetryNonce, setAutoJoinRetryNonce] = useState(0);
  const [openRoomsRetryNonce, setOpenRoomsRetryNonce] = useState(0);
  const autoJoinAttemptedRef = useRef(false);
  const autoJoinRetryCountRef = useRef(0);
  const openRoomsRetryCountRef = useRef(0);

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
          setCluesOpen(false);
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
    setRoom(state);
    setConfig(state.config);
    setCurrentRound(state.currentRound);
    setCluesOpen(false);
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

  const generateDisplayName = () => {
    setDisplayName(createRandomMultiplayerDisplayName());
  };

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

  const joinRoom = async () => {
    const playerName = getDisplayNameForAction();

    const roomCode = roomCodeInput.trim().toUpperCase();
    if (!roomCode) {
      setError("Indica o código da sala.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const state = await client.joinRoom(roomCode, playerId, playerName, joinPassword.trim() || null);
      applyRoomState(state);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível entrar na sala.");
    } finally {
      setBusy(false);
    }
  };

  const loadOpenRooms = async () => {
    setLoadingOpenRooms(true);
    setError(null);

    try {
      setOpenRooms(await client.watchOpenRooms());
      setOpenRoomsLoaded(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível carregar salas abertas.");
    } finally {
      setLoadingOpenRooms(false);
    }
  };

  const updateDisplayName = async () => {
    if (!room) {
      return;
    }

    const playerName = getDisplayNameForAction();
    setBusy(true);
    setError(null);

    try {
      const state = await client.updateDisplayName(room.roomCode, playerId, playerName);
      applyRoomState(state);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível alterar o nome.");
    } finally {
      setBusy(false);
    }
  };

  const renderNameEditor = () => (
    <div className="multiplayer-name-editor">
      <label className="multiplayer-field">
        <span>O teu nome</span>
        <input
          maxLength={24}
          onChange={(event) => setDisplayName(event.target.value)}
          value={displayName}
        />
      </label>
      <RoundedButton
        disabled={busy}
        color="neon"
        tone="ghost"
        radius="none"
        onClick={updateDisplayName}
        type="button"
      >
        Atualizar nome
      </RoundedButton>
      <RoundedButton
        disabled={busy}
        color="neon"
        tone="ghost"
        radius="none"
        onClick={generateDisplayName}
        type="button"
      >
        Gerar outro
      </RoundedButton>
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
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível submeter o palpite.");
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

  const leaveRoom = async () => {
    if (room) {
      try {
        await client.leaveRoom(room.roomCode, playerId);
      } catch {
        // Ao sair da sala, não vale a pena bloquear o regresso ao início por erro de rede.
      }
    }

    clearMultiplayerRoomResume(window.localStorage);
    window.history.replaceState(null, "", window.location.pathname);
    await client.stop();
    onBack();
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
          <RoundedButton intent="primary" radius="none" onClick={onBack} type="button">
            Voltar ao início
          </RoundedButton>
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
            <h2 className="section-title">Cria uma sala ou entra por convite.</h2>
          </div>
          <RoundedButton color="neon" tone="ghost" radius="none" onClick={onBack} type="button">
            Voltar
          </RoundedButton>
        </div>

        {error ? (
          <AppNotice
            message={error}
            onDismiss={() => setError(null)}
            tone="danger"
          />
        ) : null}

        <div className="multiplayer-entry-grid">
          <Card as="article" variant="setupPanelStack">
            <span className="muted-eyebrow">Identidade</span>
            <label className="multiplayer-field">
              <span>Nome na sala</span>
              <input
                maxLength={24}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Nome gerado automaticamente"
                value={displayName}
              />
            </label>
            <RoundedButton
              disabled={busy}
              color="neon"
              tone="ghost"
              radius="none"
              onClick={generateDisplayName}
              type="button"
            >
              Gerar outro nome
            </RoundedButton>

            <OptionGroup
              label="Visibilidade"
              options={[
                { label: "Por link", value: false },
                { label: "Sala aberta", value: true },
              ]}
              value={isPublicRoom}
              onChange={setIsPublicRoom}
            />

            <label className="multiplayer-field">
              <span>Password opcional</span>
              <input
                maxLength={48}
                onChange={(event) => setRoomPassword(event.target.value)}
                placeholder="Deixa em branco para sala sem password"
                type="password"
                value={roomPassword}
              />
            </label>

            <OptionGroup
              label="Número de rondas"
              options={[
                { label: "3 rondas", value: 3 },
                { label: "5 rondas", value: 5 },
                { label: "7 rondas", value: 7 },
              ]}
              value={config.roundCount}
              onChange={(roundCount) => setConfig((current) => ({ ...current, roundCount }))}
            />

            <OptionGroup
              label="Modo de tempo"
              options={[
                { label: "Livre", value: false },
                { label: "Cronometrado", value: true },
              ]}
              value={config.timed}
              onChange={(timed) =>
                setConfig((current) => ({
                  ...current,
                  timed,
                  roundTimeSeconds: timed ? current.roundTimeSeconds ?? 60 : null,
                }))
              }
            />

            {config.timed ? (
              <OptionGroup
                label="Tempo por ronda"
                options={[
                  { label: "45s", value: 45 },
                  { label: "60s", value: 60 },
                  { label: "90s", value: 90 },
                ]}
                value={config.roundTimeSeconds ?? 60}
                onChange={(roundTimeSeconds) =>
                  setConfig((current) => ({ ...current, roundTimeSeconds }))
                }
              />
            ) : null}

            <RoundedButton disabled={busy} intent="primary" radius="none" onClick={createRoom} type="button">
              {busy ? "A criar..." : "Criar sala"}
            </RoundedButton>
          </Card>

          <Card as="article" variant="setupPanelStack">
            <span className="muted-eyebrow">Convite</span>
            <h3>Entrar numa sala existente</h3>
            <p>Usa o código recebido por link. O nome tem de ser único dentro da sala.</p>
            <label className="multiplayer-field">
              <span>Código da sala</span>
              <input
                maxLength={6}
                onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
                placeholder="ABCD12"
                value={roomCodeInput}
              />
            </label>
            <label className="multiplayer-field">
              <span>Password, se existir</span>
              <input
                maxLength={48}
                onChange={(event) => setJoinPassword(event.target.value)}
                placeholder="Opcional"
                type="password"
                value={joinPassword}
              />
            </label>
            <RoundedButton disabled={busy} color="neon" radius="none" onClick={joinRoom} type="button">
              {busy ? "A entrar..." : "Entrar na sala"}
            </RoundedButton>
          </Card>

          <Card as="article" variant="setupPanelStack">
            <span className="muted-eyebrow">Salas abertas</span>
            <h3>Entrar sem convite direto</h3>
            <p>Mostra salas abertas que ainda não começaram. A lista atualiza em tempo real.</p>
            <RoundedButton
              disabled={loadingOpenRooms}
              color="neon"
              tone="ghost"
              radius="none"
              onClick={loadOpenRooms}
              type="button"
            >
              {loadingOpenRooms ? "A procurar salas..." : "Atualizar agora"}
            </RoundedButton>
            <div className="multiplayer-open-room-list" aria-busy={loadingOpenRooms} aria-live="polite">
              {openRooms.length === 0 ? (
                <span className="multiplayer-empty-state">
                  {loadingOpenRooms
                    ? "A procurar salas abertas..."
                    : openRoomsLoaded
                      ? "Não há salas abertas neste momento. Cria uma sala aberta ou entra por link."
                      : "Ainda não procurei salas abertas. Usa o botão acima para atualizar a lista."}
                </span>
              ) : (
                openRooms.map((openRoom) => (
                  <button
                    className="multiplayer-open-room"
                    key={openRoom.roomCode}
                    onClick={() => setRoomCodeInput(openRoom.roomCode)}
                    type="button"
                  >
                    <span>
                      Sala {openRoom.roomCode}
                      {openRoom.hasPassword ? " · com password" : " · sem password"}
                    </span>
                    <strong>
                      {openRoom.playerCount} jogador{openRoom.playerCount === 1 ? "" : "es"} · {openRoom.roundCount} rondas
                    </strong>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    );
  }

  if (room.status === "playing" && currentRound) {
    return (
      <section className="screen-shell multiplayer-screen multiplayer-screen--play">
        {error ? (
          <AppNotice
            message={error}
            onDismiss={() => setError(null)}
            tone="danger"
          />
        ) : null}
        {renderDisconnectNotice()}
        <div className="multiplayer-play-grid">
          <Card as="article" variant="tactical" className="multiplayer-scene-card">
            <div className="multiplayer-round-head">
              <span className="eyebrow">Sala {room.roomCode}</span>
              <span className="chip chip-highlight">
                Ronda {currentRound.roundNumber}/{currentRound.totalRounds}
              </span>
              <span className={`chip ${currentRound.timed ? "chip-highlight" : "chip-soft"}`}>
                <Clock3 size={14} strokeWidth={2.1} />
                {formatMultiplayerRoundTimer(currentRound, remainingSeconds)}
              </span>
              <button
                aria-label="Ver dicas"
                className="multiplayer-icon-button multiplayer-clue-button"
                onClick={() => setCluesOpen(true)}
                title="Ver dicas"
                type="button"
              >
                <CircleHelp size={18} strokeWidth={2.2} />
              </button>
            </div>
            <ChallengeSceneArt challenge={currentRound.challenge} />
            <div className="multiplayer-clue-panel" aria-label="Dicas da ronda">
              <span className="muted-eyebrow">Dicas</span>
              <div className="multiplayer-clue-list">
                {renderClueItems()}
              </div>
            </div>
          </Card>

          <Card as="aside" variant="tacticalStack" className="multiplayer-players-card">
            <span className="muted-eyebrow">Jogadores</span>
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
            {hasSubmitted ? (
              <div className="multiplayer-waiting">
                Palpite registado. À espera dos outros jogadores ou do fim do tempo.
              </div>
            ) : null}
          </Card>

          <Card as="article" variant="tactical" className="multiplayer-map-card">
            <EuropeGuessMap
              guess={guess}
              onGuessChange={setGuess}
              showFooter
            />
            <div className="multiplayer-map-actions">
              <RoundedButton color="neon" tone="ghost" radius="none" onClick={leaveRoom} type="button">
                Sair da sala
              </RoundedButton>
              <RoundedButton
                disabled={busy || hasSubmitted || !guess}
                intent="primary"
                radius="none"
                onClick={submitGuess}
                type="button"
              >
                {hasSubmitted ? "Palpite enviado" : "Enviar palpite"}
              </RoundedButton>
            </div>
          </Card>
        </div>
        {cluesOpen ? (
          <div className="multiplayer-clue-modal-backdrop" role="presentation" onClick={() => setCluesOpen(false)}>
            <div
              aria-labelledby="multiplayer-clue-modal-title"
              aria-modal="true"
              className="multiplayer-clue-modal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className="multiplayer-clue-modal-head">
                <h3 id="multiplayer-clue-modal-title">Dicas da ronda</h3>
                <button
                  aria-label="Fechar dicas"
                  className="multiplayer-icon-button"
                  onClick={() => setCluesOpen(false)}
                  title="Fechar dicas"
                  type="button"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </div>
              <div className="multiplayer-clue-list">
                {renderClueItems()}
              </div>
            </div>
          </div>
        ) : null}
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
            <h2 className="section-title">Todos os palpites foram fechados.</h2>
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
            <h2 className="section-title">Classificação final da sala.</h2>
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
      <div className="section-header section-header-inline">
        <div>
          <div className="eyebrow">sala {room.roomCode}</div>
          <h2 className="section-title">Sala multiplayer.</h2>
          <p>
            {room.isPublic ? "Sala aberta na lista pública." : "Sala privada por link."}
            {room.hasPassword ? " Protegida por password." : " Sem password."}
          </p>
        </div>
        <div className="setup-header-actions">
          <RoundedButton color="neon" tone="ghost" radius="none" onClick={copyShareUrl} type="button">
            {copied ? "Link copiado" : "Copiar link"}
          </RoundedButton>
          <RoundedButton color="neon" tone="subtle" radius="none" onClick={leaveRoom} type="button">
            Sair
          </RoundedButton>
        </div>
      </div>

      <div className="multiplayer-lobby-grid">
        <Card as="article" variant="setupPanelStack">
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

        <Card as="article" variant="setupPanelStack">
          <span className="muted-eyebrow">Configuração</span>
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
            <OptionGroup
              label="Tempo por ronda"
              options={[
                { label: "45s", value: 45 },
                { label: "60s", value: 60 },
                { label: "90s", value: 90 },
              ]}
              value={config.roundTimeSeconds ?? 60}
              onChange={(roundTimeSeconds) => void updateConfig({ ...config, roundTimeSeconds })}
            />
          ) : null}
          <RoundedButton disabled={!isOwner || busy} intent="primary" radius="none" onClick={startGame} type="button">
            {isOwner ? "Iniciar partida" : "À espera do dono da sala"}
          </RoundedButton>
        </Card>
      </div>
    </section>
  );
}
