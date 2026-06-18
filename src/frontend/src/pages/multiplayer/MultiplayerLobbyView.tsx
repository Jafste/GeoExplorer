import { Card } from "../../components/layout/card/card";
import { CountryScopeSelect } from "../../components/CountryScopeSelect";
import { RoundTimeControl } from "../../components/RoundTimeControl";
import { AppNotice } from "../../components/ui/AppNotice";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { RoundedButton } from "../../components/ui/roundedButton";
import type {
  MultiplayerPlayer,
  MultiplayerRoomState,
  SessionConfig,
} from "../../types/game";
import { formatSessionTimer } from "./multiplayerFormat";
import { NameEditor, type NameEditorProps } from "./MultiplayerNameEditor";
import { DisconnectNotice, formatPlayerName, PlayerStatus } from "./MultiplayerRoomShared";

interface MultiplayerLobbyViewProps extends NameEditorProps {
  busy: boolean;
  config: SessionConfig;
  copied: boolean;
  currentPlayerId: string;
  disconnectedPlayers: MultiplayerPlayer[];
  disconnectClock: number;
  error: string | null;
  isOwner: boolean;
  onCopyShareUrl: () => void;
  onDismissError: () => void;
  onLeaveRoom: () => void;
  onStartGame: () => void;
  onUpdateConfig: (config: SessionConfig) => void;
  playerJoining: boolean;
  room: MultiplayerRoomState;
}

export function MultiplayerLobbyView({
  busy,
  config,
  copied,
  currentPlayerId,
  disconnectedPlayers,
  disconnectClock,
  displayName,
  error,
  isOwner,
  onCopyShareUrl,
  onDismissError,
  onDisplayNameChange,
  onLeaveRoom,
  onRandomizeDisplayName,
  onStartGame,
  onUpdateConfig,
  playerJoining,
  room,
}: MultiplayerLobbyViewProps) {
  return (
    <section className="screen-shell multiplayer-screen">
      {error ? (
        <AppNotice
          message={error}
          onDismiss={onDismissError}
          tone="danger"
        />
      ) : null}
      <DisconnectNotice
        currentPlayerId={currentPlayerId}
        disconnectClock={disconnectClock}
        players={disconnectedPlayers}
      />
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
          <RoundedButton color="neon" tone="ghost" radius="none" onClick={onCopyShareUrl} type="button">
            {copied ? "Link copiado" : "Copiar link"}
          </RoundedButton>
          <RoundedButton color="neon" tone="subtle" radius="none" onClick={onLeaveRoom} type="button">
            Sair
          </RoundedButton>
        </div>
      </div>

      <div className="multiplayer-lobby-grid">
        <Card as="article" variant="setupPanelStack" className="multiplayer-lobby-card multiplayer-lobby-players-card">
          <span className="muted-eyebrow">Jogadores</span>
          <NameEditor
            busy={busy}
            displayName={displayName}
            onDisplayNameChange={onDisplayNameChange}
            onRandomizeDisplayName={onRandomizeDisplayName}
          />
          <div className="multiplayer-player-list">
            {room.players.map((player) => (
              <div className="multiplayer-player-row" key={player.playerId}>
                <span>{formatPlayerName(player.displayName, player.playerId, currentPlayerId)}</span>
                <PlayerStatus
                  context="lobby"
                  disconnectClock={disconnectClock}
                  player={player}
                />
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
          <CountryScopeSelect
            value={config.countries ?? (config.country ? [config.country] : [])}
            onChange={(countries) => onUpdateConfig({ ...config, country: null, countries })}
          />
          <SegmentedControl
            label="Número de rondas"
            options={[
              { label: "3 rondas", value: 3 },
              { label: "5 rondas", value: 5 },
              { label: "7 rondas", value: 7 },
            ]}
            value={config.roundCount}
            onChange={(roundCount) => onUpdateConfig({ ...config, roundCount })}
          />
          <SegmentedControl
            label="Modo de tempo"
            options={[
              { label: "Livre", value: false },
              { label: "Cronometrado", value: true },
            ]}
            value={config.timed}
            onChange={(timed) =>
              onUpdateConfig({
                ...config,
                timed,
                roundTimeSeconds: timed ? config.roundTimeSeconds ?? 60 : null,
              })
            }
          />
          {config.timed ? (
            <RoundTimeControl
              value={config.roundTimeSeconds}
              onChange={(roundTimeSeconds) => onUpdateConfig({ ...config, roundTimeSeconds })}
            />
          ) : null}
          <RoundedButton disabled={!isOwner || busy} intent="primary" radius="none" onClick={onStartGame} type="button">
            {isOwner ? "Lançar missão" : "À espera do dono da sala"}
          </RoundedButton>
        </Card>
      </div>
    </section>
  );
}
