import type { SurfacePhase } from "../app/navigation";
import type { MultiplayerSidebarContext } from "../app/sidebarContext";
import type { RoundResolutionResponse, SessionConfig, SessionResult } from "../types/game";

export interface SidebarMetric {
  label: string;
  value: string;
}

function getTimerLabel(config: Pick<SessionConfig, "timed" | "roundTimeSeconds">) {
  if (!config.timed) {
    return "Livre";
  }

  return config.roundTimeSeconds ? `${config.roundTimeSeconds}s` : "Cronometrado";
}

function formatRegionLabel(region: SessionConfig["region"]) {
  return region === "europe" ? "Europa" : region;
}

function formatScopeLabel(config: Pick<SessionConfig, "region" | "country" | "countries">) {
  const countries = config.countries?.filter(Boolean) ?? [];

  if (countries.length === 1) {
    return countries[0];
  }

  if (countries.length > 1) {
    return countries.length <= 3 ? countries.join(", ") : `${countries.length} países`;
  }

  return config.country?.trim() || formatRegionLabel(config.region);
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? `${value.toLocaleString("pt-PT")} pts` : "Sem dados";
}

function formatDistance(value: number | null | undefined) {
  return typeof value === "number" ? `${value.toFixed(1)} km` : "Sem dados";
}

function formatRemainingSeconds(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Livre";
  }

  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatRoundLabel(roundNumber?: number, totalRounds?: number) {
  if (!roundNumber || !totalRounds) {
    return "Por iniciar";
  }

  return `${roundNumber}/${totalRounds}`;
}

function formatPlayerCount(context: MultiplayerSidebarContext) {
  const total = context.playerCount ?? 0;
  const connected = context.connectedPlayerCount ?? total;
  return `${connected}/${total}`;
}

function formatOpenRooms(context: MultiplayerSidebarContext) {
  if (context.loadingOpenRooms) {
    return "A procurar";
  }

  if (!context.openRoomsLoaded) {
    return "Por carregar";
  }

  const count = context.openRoomCount ?? 0;
  return `${count}`;
}

function formatRoomAccess(context: MultiplayerSidebarContext) {
  const visibility = context.isPublic ? "Aberta" : "Por link";
  return context.hasPassword ? `${visibility} + password` : `${visibility} sem password`;
}

function getDisplayName(context: MultiplayerSidebarContext) {
  return context.displayName?.trim() || "Por definir";
}

function getMultiplayerMetrics(
  context: MultiplayerSidebarContext | null,
  fallbackConfig: SessionConfig
): SidebarMetric[] {
  if (!context) {
    return [
      { label: "Modo", value: "Multiplayer" },
      { label: "Estado", value: "A preparar" },
      { label: "Ritmo", value: getTimerLabel(fallbackConfig) },
      { label: "Âmbito", value: formatScopeLabel(fallbackConfig) },
    ];
  }

  if (context.mode === "api-required") {
    return [
      { label: "Modo", value: "Multiplayer" },
      { label: "Backend", value: "Modo api" },
      { label: "Estado", value: "Indisponível" },
    ];
  }

  if (context.mode === "entry") {
    return [
      { label: "Modo", value: "Multiplayer" },
      { label: "Code name", value: getDisplayName(context) },
      { label: "Salas abertas", value: formatOpenRooms(context) },
      { label: "Ritmo", value: getTimerLabel(context.config) },
      { label: "Âmbito", value: formatScopeLabel(context.config) },
    ];
  }

  if (context.mode === "round-result") {
    return [
      { label: "Sala", value: context.roomCode ?? "Sem código" },
      { label: "Ronda", value: formatRoundLabel(context.roundNumber, context.totalRounds) },
      { label: "A tua ronda", value: formatScore(context.latestRoundScore) },
      { label: "Distância", value: formatDistance(context.latestRoundDistanceKm) },
      { label: "Pronto", value: context.hasReady ? "Sim" : "Não" },
    ];
  }

  if (context.mode === "completed") {
    return [
      { label: "Sala", value: context.roomCode ?? "Sem código" },
      { label: "Total", value: formatScore(context.currentPlayerScore) },
      { label: "Posição", value: context.finalRank ? `#${context.finalRank}` : "Sem dados" },
      { label: "Jogadores", value: formatPlayerCount(context) },
    ];
  }

  if (context.mode === "playing") {
    return [
      { label: "Sala", value: context.roomCode ?? "Sem código" },
      { label: "Ronda", value: formatRoundLabel(context.roundNumber, context.totalRounds) },
      { label: "Tempo", value: formatRemainingSeconds(context.remainingSeconds) },
      { label: "Posição", value: context.hasSubmitted ? "Submetida" : "Em aberto" },
      { label: "Jogadores", value: formatPlayerCount(context) },
    ];
  }

  return [
    { label: "Sala", value: context.roomCode ?? "Sem código" },
    { label: "Jogadores", value: formatPlayerCount(context) },
    { label: "Cargo", value: context.isOwner ? "Dono" : "Convidado" },
    { label: "Acesso", value: formatRoomAccess(context) },
    { label: "Ritmo", value: getTimerLabel(context.config) },
    { label: "Âmbito", value: formatScopeLabel(context.config) },
  ];
}

export function getSidebarMetrics(
  phase: SurfacePhase,
  config: SessionConfig,
  multiplayerContext: MultiplayerSidebarContext | null,
  roundResolution: RoundResolutionResponse | null,
  sessionResult: SessionResult | null
): SidebarMetric[] {
  if (phase === "multiplayer") {
    return getMultiplayerMetrics(multiplayerContext, config);
  }

  if (phase === "round-result" && roundResolution) {
    return [
      { label: "Relatório", value: `Ronda ${roundResolution.result.roundNumber}` },
      { label: "Pontuação", value: formatScore(roundResolution.result.score) },
      { label: "Distância", value: formatDistance(roundResolution.result.distanceKm) },
      {
        label: "Próximo",
        value: roundResolution.progress.completed
          ? "Relatório final"
          : `Ronda ${roundResolution.progress.nextRoundNumber ?? "-"}`,
      },
    ];
  }

  if (phase === "session-result" && sessionResult) {
    const averageScore =
      sessionResult.totalRounds > 0
        ? Math.round(sessionResult.totalScore / sessionResult.totalRounds)
        : 0;

    return [
      { label: "Total", value: formatScore(sessionResult.totalScore) },
      { label: "Média", value: formatScore(averageScore) },
      { label: "Rondas", value: `${sessionResult.totalRounds}` },
      { label: "Ritmo", value: getTimerLabel(sessionResult) },
    ];
  }

  if (phase === "landing") {
    return [];
  }

  return [
    { label: "Modo", value: "Solo" },
    { label: "Rondas", value: `${config.roundCount}` },
    { label: "Ritmo", value: getTimerLabel(config) },
    { label: "Âmbito", value: formatScopeLabel(config) },
  ];
}
