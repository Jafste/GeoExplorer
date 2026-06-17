import { EuropeGuessMap } from "../../components/EuropeGuessMap";
import { Card } from "../../components/layout/card/card";
import { AppNotice } from "../../components/ui/AppNotice";
import { RoundedButton } from "../../components/ui/roundedButton";
import type {
  MultiplayerPlayer,
  MultiplayerRoomState,
  MultiplayerRoundResult,
  MultiplayerSessionResult,
} from "../../types/game";
import { getMultiplayerRoundResolutionLabel } from "./multiplayerLabels";
import { DisconnectNotice, formatPlayerName } from "./MultiplayerRoomShared";

interface MultiplayerRoundResultViewProps {
  busy: boolean;
  currentPlayerId: string;
  disconnectedPlayers: MultiplayerPlayer[];
  disconnectClock: number;
  error: string | null;
  hasReady: boolean;
  onDismissError: () => void;
  onReadyForNextRound: () => void;
  playerId: string;
  room: MultiplayerRoomState;
  roundResult: MultiplayerRoundResult;
}

export function MultiplayerRoundResultView({
  busy,
  currentPlayerId,
  disconnectedPlayers,
  disconnectClock,
  error,
  hasReady,
  onDismissError,
  onReadyForNextRound,
  playerId,
  room,
  roundResult,
}: MultiplayerRoundResultViewProps) {
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
          onDismiss={onDismissError}
          tone="danger"
        />
      ) : null}
      <DisconnectNotice
        currentPlayerId={currentPlayerId}
        disconnectClock={disconnectClock}
        players={disconnectedPlayers}
      />
      <div className="section-header section-header-inline">
        <div>
          <div className="eyebrow">resultado da sala {room.roomCode}</div>
          <h2 className="section-title">Posições confirmadas.</h2>
        </div>
        <RoundedButton disabled={busy || hasReady} intent="primary" radius="none" onClick={onReadyForNextRound} type="button">
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
                  <span>{index + 1}. {formatPlayerName(result.displayName, result.playerId, currentPlayerId)}</span>
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

interface MultiplayerCompletedViewProps {
  busy: boolean;
  currentPlayerId: string;
  disconnectedPlayers: MultiplayerPlayer[];
  disconnectClock: number;
  error: string | null;
  isOwner: boolean;
  onDismissError: () => void;
  onLeaveRoom: () => void;
  onReturnToLobby: () => void;
  result: MultiplayerSessionResult;
}

export function MultiplayerCompletedView({
  busy,
  currentPlayerId,
  disconnectedPlayers,
  disconnectClock,
  error,
  isOwner,
  onDismissError,
  onLeaveRoom,
  onReturnToLobby,
  result,
}: MultiplayerCompletedViewProps) {
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
            onClick={onReturnToLobby}
            type="button"
          >
            {isOwner ? "Voltar à sala" : "À espera do dono"}
          </RoundedButton>
          <RoundedButton color="neon" tone="ghost" radius="none" onClick={onLeaveRoom} type="button">
            Sair
          </RoundedButton>
        </div>
      </div>

      <Card as="article" variant="tacticalStack">
        <div className="multiplayer-leaderboard multiplayer-leaderboard--final">
          {result.players.map((player, index) => (
            <div className="multiplayer-leaderboard-row" key={player.playerId}>
              <span>{index + 1}. {formatPlayerName(player.displayName, player.playerId, currentPlayerId)}</span>
              <strong>{player.totalScore.toLocaleString("pt-PT")} pts</strong>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
