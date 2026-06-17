import { CircleHelp, Clock3, DoorOpen, UsersRound, X } from "lucide-react";
import { ChallengeSceneArt } from "../../components/ChallengeSceneArt";
import { RoundMinimapDock } from "../round/components/RoundMinimapDock";
import { AppNotice } from "../../components/ui/AppNotice";
import { IconButton } from "../../components/ui/Button";
import { ModalDialog } from "../../components/ui/ModalDialog";
import type {
  ChallengeRound,
  GuessCoordinates,
  MultiplayerPlayer,
  MultiplayerRoomState,
} from "../../types/game";
import { formatMultiplayerRoundTimer } from "./multiplayerRoundTimer";
import { DisconnectNotice, formatPlayerName, PlayerStatus } from "./MultiplayerRoomShared";

function ClueList({ currentRound }: { currentRound: ChallengeRound }) {
  if (!currentRound.challenge.clues.length) {
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
}

interface MultiplayerPlayingViewProps {
  busy: boolean;
  cluesOpen: boolean;
  currentRound: ChallengeRound;
  currentPlayerId: string;
  disconnectedPlayers: MultiplayerPlayer[];
  disconnectClock: number;
  error: string | null;
  guess: GuessCoordinates | null;
  hasSubmitted: boolean;
  mapHovered: boolean;
  mapPinnedOpen: boolean;
  onCloseClues: () => void;
  onClosePlayers: () => void;
  onDismissError: () => void;
  onGuessChange: (guess: GuessCoordinates) => void;
  onLeaveRoom: () => void;
  onMouseEnterMap: () => void;
  onMouseLeaveMap: () => void;
  onOpenClues: () => void;
  onSubmitGuess: () => Promise<void>;
  onToggleMapPinnedOpen: () => void;
  onTogglePlayers: () => void;
  playerJoining: boolean;
  playersOpen: boolean;
  remainingSeconds: number | null;
  room: MultiplayerRoomState;
}

export function MultiplayerPlayingView({
  busy,
  cluesOpen,
  currentRound,
  currentPlayerId,
  disconnectedPlayers,
  disconnectClock,
  error,
  guess,
  hasSubmitted,
  mapHovered,
  mapPinnedOpen,
  onCloseClues,
  onClosePlayers,
  onDismissError,
  onGuessChange,
  onLeaveRoom,
  onMouseEnterMap,
  onMouseLeaveMap,
  onOpenClues,
  onSubmitGuess,
  onToggleMapPinnedOpen,
  onTogglePlayers,
  playerJoining,
  playersOpen,
  remainingSeconds,
  room,
}: MultiplayerPlayingViewProps) {
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
              onClick={onOpenClues}
              title="Ver dicas"
            >
              <CircleHelp size={18} strokeWidth={2.2} />
            </IconButton>
            <IconButton
              aria-expanded={playersOpen}
              className={`multiplayer-icon-button${playersOpen ? " is-active" : ""}`}
              label={playersOpen ? "Esconder jogadores" : "Ver jogadores"}
              onClick={onTogglePlayers}
              title={playersOpen ? "Esconder jogadores" : "Ver jogadores"}
            >
              <UsersRound size={18} strokeWidth={2.2} />
            </IconButton>
            <IconButton
              className="multiplayer-icon-button"
              label="Sair da sala"
              onClick={onLeaveRoom}
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
              onDismiss={onDismissError}
              tone="danger"
            />
          </div>
        ) : null}

        <div className="multiplayer-immersive-disconnect">
          <DisconnectNotice
            currentPlayerId={currentPlayerId}
            disconnectClock={disconnectClock}
            players={disconnectedPlayers}
          />
        </div>

        <RoundMinimapDock
          busy={busy || hasSubmitted}
          guess={guess}
          mapHovered={mapHovered}
          mapPinnedOpen={mapPinnedOpen}
          onGuessChange={onGuessChange}
          onMouseEnter={onMouseEnterMap}
          onMouseLeave={onMouseLeaveMap}
          onSubmit={onSubmitGuess}
          onTogglePinnedOpen={onToggleMapPinnedOpen}
          timed={currentRound.timed}
        />

        {playersOpen ? (
          <aside className="multiplayer-players-overlay" aria-label="Jogadores da sala">
            <div className="multiplayer-players-overlay-head">
              <span className="muted-eyebrow">Jogadores</span>
              <IconButton
                className="multiplayer-icon-button"
                label="Esconder jogadores"
                onClick={onClosePlayers}
                title="Esconder jogadores"
              >
                <X size={18} strokeWidth={2.2} />
              </IconButton>
            </div>
            <div className="multiplayer-player-list">
              {room.players.map((player) => (
                <div className="multiplayer-player-row" key={player.playerId}>
                  <span>{formatPlayerName(player.displayName, player.playerId, currentPlayerId)}</span>
                  <PlayerStatus
                    context="playing"
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
          </aside>
        ) : null}

        {cluesOpen ? (
          <ModalDialog title="Briefing da ronda" onClose={onCloseClues}>
            <div className="multiplayer-clue-list">
              <ClueList currentRound={currentRound} />
            </div>
          </ModalDialog>
        ) : null}
      </div>
    </section>
  );
}
