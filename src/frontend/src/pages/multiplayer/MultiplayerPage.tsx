import { useEffect, useMemo, useState } from "react";
import { ChallengeSceneArt } from "../../components/ChallengeSceneArt";
import { EuropeGuessMap } from "../../components/EuropeGuessMap";
import { Card } from "../../components/layout/card/card";
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
  MultiplayerRoomState,
  MultiplayerRoundResult,
  MultiplayerSessionResult,
  SessionConfig,
} from "../../types/game";
import { getMultiplayerPlayerStatus } from "./multiplayerLabels";

interface MultiplayerPageProps {
  initialRoomCode?: string | null;
  onBack: () => void;
}

const DISPLAY_NAME_STORAGE_KEY = "geoexplorer.multiplayer.displayName";

export function MultiplayerPage({ initialRoomCode, onBack }: MultiplayerPageProps) {
  const playerId = useMemo(() => getOrCreateMultiplayerPlayerId(), []);
  const [displayName, setDisplayName] = useState(
    () => window.localStorage.getItem(DISPLAY_NAME_STORAGE_KEY) ?? createRandomMultiplayerDisplayName()
  );
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode ?? "");
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
  const [roundResult, setRoundResult] = useState<MultiplayerRoundResult | null>(null);
  const [finalResult, setFinalResult] = useState<MultiplayerSessionResult | null>(null);
  const [guess, setGuess] = useState<GuessCoordinates | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const client = useMemo(
    () =>
      new MultiplayerClient(appConfig.apiBaseUrl, {
        onRoomUpdated: (state) => applyRoomState(state),
        onRoundStarted: (round) => {
          setCurrentRound(round);
          setRoundResult(null);
          setFinalResult(null);
          setGuess(null);
        },
        onRoundResolved: (result) => {
          setRoundResult(result);
          setGuess(null);
        },
        onGameCompleted: (result) => {
          setFinalResult(result);
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
    setRoom(state);
    setConfig(state.config);
    setCurrentRound(state.currentRound);
    setRoundResult(state.lastRoundResult);
    setFinalResult(state.finalResult);
    setPlayerJoining(false);
    const ownPlayer = state.players.find((player) => player.playerId === playerId);
    if (ownPlayer) {
      setDisplayName(ownPlayer.displayName);
      window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, ownPlayer.displayName);
    }

    const nextUrl = `${window.location.pathname}?room=${state.roomCode}`;
    window.history.replaceState(null, "", nextUrl);
  };

  const isApiMode = appConfig.dataMode === "api";
  const currentPlayer = room?.players.find((player) => player.playerId === playerId) ?? null;
  const isOwner = Boolean(currentPlayer?.isOwner);
  const hasSubmitted = Boolean(currentPlayer?.submitted);
  const hasReady = Boolean(currentPlayer?.ready);
  const shareUrl = room
    ? `${window.location.origin}${window.location.pathname}?room=${room.roomCode}`
    : "";

  const saveDisplayName = (name: string) => {
    window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, name);
  };

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

  const createRoom = async () => {
    const playerName = getDisplayNameForAction();

    setBusy(true);
    setError(null);
    saveDisplayName(playerName);

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
    saveDisplayName(playerName);

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
      setOpenRooms(await client.listOpenRooms());
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
    saveDisplayName(playerName);

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

  const leaveRoom = async () => {
    if (room) {
      try {
        await client.leaveRoom(room.roomCode, playerId);
      } catch {
        // Ao sair da sala, não vale a pena bloquear o regresso ao início por erro de rede.
      }
    }

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

        {error ? <div className="alert-banner" role="alert">{error}</div> : null}

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
            <p>Mostra salas abertas que ainda não começaram. Algumas podem pedir password.</p>
            <RoundedButton
              disabled={loadingOpenRooms}
              color="neon"
              tone="ghost"
              radius="none"
              onClick={loadOpenRooms}
              type="button"
            >
              {loadingOpenRooms ? "A procurar salas..." : "Ver salas abertas"}
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
        {error ? <div className="alert-banner" role="alert">{error}</div> : null}
        <div className="multiplayer-play-grid">
          <Card as="article" variant="tactical" className="multiplayer-scene-card">
            <div className="multiplayer-round-head">
              <span className="eyebrow">Sala {room.roomCode}</span>
              <span className="chip chip-highlight">
                Ronda {currentRound.roundNumber}/{currentRound.totalRounds}
              </span>
            </div>
            <ChallengeSceneArt challenge={currentRound.challenge} />
          </Card>

          <Card as="aside" variant="tacticalStack">
            <span className="muted-eyebrow">Jogadores</span>
            {renderNameEditor()}
            <div className="multiplayer-player-list">
              {room.players.map((player) => (
                <div className="multiplayer-player-row" key={player.playerId}>
                  <span>{formatPlayerName(player.displayName, player.playerId)}</span>
                  <strong>{getMultiplayerPlayerStatus(player, "playing")}</strong>
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
        {error ? <div className="alert-banner" role="alert">{error}</div> : null}
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
            {renderNameEditor()}
            <div className="multiplayer-leaderboard">
              {roundResult.playerResults.map((result, index) => (
                <div className="multiplayer-leaderboard-row" key={result.playerId}>
                  <span>{index + 1}. {formatPlayerName(result.displayName, result.playerId)}</span>
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
        <div className="section-header section-header-inline">
          <div>
            <div className="eyebrow">fim da partida</div>
            <h2 className="section-title">Classificação final da sala.</h2>
          </div>
          <RoundedButton intent="primary" radius="none" onClick={leaveRoom} type="button">
            Voltar ao início
          </RoundedButton>
        </div>

        <Card as="article" variant="tacticalStack">
          {renderNameEditor()}
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
      {error ? <div className="alert-banner" role="alert">{error}</div> : null}
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
                <strong>{getMultiplayerPlayerStatus(player, "lobby")}</strong>
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
