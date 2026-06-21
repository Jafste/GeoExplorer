import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatScore } from "../../app/format";
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
import { getRoundResultPlayerHotspots } from "./multiplayerResultMap";
import { DisconnectNotice, formatPlayerName } from "./MultiplayerRoomShared";

const ROUND_RESULT_PAGE_SIZE = 3;

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
  showTotalScore: boolean;
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
  showTotalScore,
}: MultiplayerRoundResultViewProps) {
  const [leaderboardPage, setLeaderboardPage] = useState(0);
  const ownResult = roundResult.playerResults.find((result) => result.playerId === playerId) ?? null;
  const totalScoreByPlayerId = new Map(room.players.map((player) => [player.playerId, player.totalScore]));
  const playerHotspots = getRoundResultPlayerHotspots(roundResult, playerId);
  const actual = {
    latitude: roundResult.correctLatitude,
    longitude: roundResult.correctLongitude,
    label: `${roundResult.city}, ${roundResult.country}`,
  };
  const leaderboardPageCount = Math.max(1, Math.ceil(roundResult.playerResults.length / ROUND_RESULT_PAGE_SIZE));
  const visibleLeaderboardPage = Math.min(leaderboardPage, leaderboardPageCount - 1);
  const leaderboardStart = visibleLeaderboardPage * ROUND_RESULT_PAGE_SIZE;
  const visiblePlayerResults = roundResult.playerResults.slice(
    leaderboardStart,
    leaderboardStart + ROUND_RESULT_PAGE_SIZE,
  );
  const hasLeaderboardPages = leaderboardPageCount > 1;

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
        <Card as="article" className="multiplayer-result-map-card" variant="tacticalStack">
          <EuropeGuessMap
            actual={actual}
            comparisonDistanceKm={ownResult?.distanceKm ?? null}
            disabled
            fitToMarkers
            guess={ownResult?.guess ?? null}
            hotspots={playerHotspots}
            showComparisonLine={Boolean(ownResult?.guess)}
            showFooter={false}
          />
          <a className="multiplayer-result-jump" href="#round-ranking">
            Ver classificação
          </a>
        </Card>

        <div className="multiplayer-result-ranking-anchor" id="round-ranking">
          <Card as="article" variant="tacticalStack">
            <span className="muted-eyebrow">Ranking da ronda</span>
            <h3>{roundResult.city}, {roundResult.country}</h3>
            <div className="multiplayer-leaderboard">
              {visiblePlayerResults.map((result, index) => (
                <div className="multiplayer-leaderboard-row" key={result.playerId}>
                  <div className="multiplayer-leaderboard-copy">
                    <span>{leaderboardStart + index + 1}. {formatPlayerName(result.displayName, result.playerId, currentPlayerId)}</span>
                    <small>{getMultiplayerRoundResolutionLabel(result.resolution)}</small>
                  </div>
                  <div className="multiplayer-leaderboard-score">
                    <strong>{showTotalScore ? `+${formatScore(result.score)}` : formatScore(result.score)}</strong>
                    {showTotalScore ? <small>Total {formatScore(totalScoreByPlayerId.get(result.playerId))}</small> : null}
                  </div>
                </div>
              ))}
            </div>
            {hasLeaderboardPages ? (
              <div className="multiplayer-leaderboard-pager" aria-label="Paginação da classificação">
                <button
                  aria-label="Página anterior da classificação"
                  className="multiplayer-pager-button"
                  disabled={visibleLeaderboardPage === 0}
                  onClick={() => setLeaderboardPage((page) => Math.max(0, page - 1))}
                  type="button"
                >
                  <ChevronLeft size={17} strokeWidth={2.4} />
                </button>
                <span>{visibleLeaderboardPage + 1}/{leaderboardPageCount}</span>
                <button
                  aria-label="Página seguinte da classificação"
                  className="multiplayer-pager-button"
                  disabled={visibleLeaderboardPage >= leaderboardPageCount - 1}
                  onClick={() => setLeaderboardPage((page) => Math.min(leaderboardPageCount - 1, page + 1))}
                  type="button"
                >
                  <ChevronRight size={17} strokeWidth={2.4} />
                </button>
              </div>
            ) : null}
          </Card>
        </div>
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
              <strong>{formatScore(player.totalScore)}</strong>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
