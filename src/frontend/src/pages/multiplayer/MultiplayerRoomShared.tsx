import { AppNotice } from "../../components/ui/AppNotice";
import type { MultiplayerPlayer } from "../../types/game";
import { getMultiplayerPlayerStatus } from "./multiplayerLabels";

export function formatPlayerName(name: string, targetPlayerId: string, currentPlayerId: string) {
  return targetPlayerId === currentPlayerId ? `${name} (eu)` : name;
}

function formatDisconnectRemaining(endsAt: string, disconnectClock: number) {
  const endTime = new Date(endsAt).getTime();
  const remainingSecondsUntilExpiry = Number.isFinite(endTime)
    ? Math.max(0, Math.ceil((endTime - disconnectClock) / 1000))
    : 0;
  const minutes = Math.floor(remainingSecondsUntilExpiry / 60);
  const seconds = remainingSecondsUntilExpiry % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatDisconnectedNames(players: MultiplayerPlayer[], currentPlayerId: string) {
  const names = players.map((player) =>
    formatPlayerName(player.displayName, player.playerId, currentPlayerId)
  );

  if (names.length <= 1) {
    return names[0] ?? "Um jogador";
  }

  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

interface PlayerStatusProps {
  context: "lobby" | "playing";
  disconnectClock: number;
  player: MultiplayerPlayer;
}

export function PlayerStatus({ context, disconnectClock, player }: PlayerStatusProps) {
  return (
    <strong className="multiplayer-player-status">
      {getMultiplayerPlayerStatus(player, context)}
      {!player.connected && player.disconnectGraceEndsAt ? (
        <small>{formatDisconnectRemaining(player.disconnectGraceEndsAt, disconnectClock)}</small>
      ) : null}
    </strong>
  );
}

interface DisconnectNoticeProps {
  currentPlayerId: string;
  disconnectClock: number;
  players: MultiplayerPlayer[];
}

export function DisconnectNotice({
  currentPlayerId,
  disconnectClock,
  players,
}: DisconnectNoticeProps) {
  if (players.length === 0) {
    return null;
  }

  const nextExpiry = players
    .map((player) => player.disconnectGraceEndsAt)
    .filter((endsAt): endsAt is string => Boolean(endsAt))
    .sort()[0];
  const plural = players.length > 1;
  const playerNames = formatDisconnectedNames(players, currentPlayerId);
  const remainingLabel = nextExpiry
    ? formatDisconnectRemaining(nextExpiry, disconnectClock)
    : "00:00";

  return (
    <AppNotice
      title="Ligação em espera"
      message={`${playerNames} ${plural ? "perderam" : "perdeu"} a ligação. A sala segue automaticamente em ${remainingLabel} se ${plural ? "não voltarem" : "não voltar"}.`}
      tone="info"
    />
  );
}
