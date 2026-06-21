import type { ReactNode } from "react";
import { Gauge, House, Settings2, Shuffle, UsersRound } from "lucide-react";
import type { SurfacePhase } from "../app/navigation";
import type { MultiplayerSidebarContext } from "../app/sidebarContext";
import type { RoundResolutionResponse, SessionConfig, SessionResult } from "../types/game";
import { getSidebarMetrics } from "./appSidebarMetrics";
import { ButtonBase } from "./ui/Button";

interface AppSidebarProps {
  analysisEnabled: boolean;
  config: SessionConfig;
  isOpen?: boolean;
  multiplayerContext?: MultiplayerSidebarContext | null;
  phase: SurfacePhase;
  roundResolution?: RoundResolutionResponse | null;
  sessionResult?: SessionResult | null;
  onHome: () => void;
  onOpenMultiplayer: () => void;
  onOpenAnalysis: () => void;
  onQuickStart?: () => void;
  onStart: () => void;
}

interface SidebarActionProps {
  active?: boolean;
  children: ReactNode;
  disabledReason?: string | null;
  icon: ReactNode;
  id: string;
  onClick: () => void;
}

function SidebarAction({
  active = false,
  children,
  disabledReason,
  icon,
  id,
  onClick,
}: SidebarActionProps) {
  const disabled = Boolean(disabledReason);
  const tooltipId = `${id}-tooltip`;
  const button = (
    <ButtonBase
      aria-describedby={disabled ? tooltipId : undefined}
      aria-disabled={disabled || undefined}
      className={`app-sidebar-link${active ? " is-active" : ""}`}
      onClick={disabled ? undefined : onClick}
      title={disabledReason ?? undefined}
    >
      {icon}
      <span>{children}</span>
    </ButtonBase>
  );

  if (!disabled) {
    return button;
  }

  return (
    <span className="app-sidebar-tooltip">
      {button}
      <span className="app-sidebar-tooltip-bubble" id={tooltipId} role="tooltip">
        {disabledReason}
      </span>
    </span>
  );
}

export function AppSidebar({
  analysisEnabled,
  config,
  isOpen = false,
  multiplayerContext = null,
  phase,
  roundResolution = null,
  sessionResult = null,
  onHome,
  onOpenMultiplayer,
  onOpenAnalysis,
  onQuickStart,
  onStart,
}: AppSidebarProps) {
  const metrics = getSidebarMetrics(
    phase,
    config,
    multiplayerContext,
    roundResolution,
    sessionResult
  );
  const inMultiplayerRoom = phase === "multiplayer" && Boolean(multiplayerContext?.roomCode);
  const setupDisabledReason = inMultiplayerRoom
    ? "Sai da sala para mudares a configuração do jogo solo."
    : null;
  const hasAnalysis =
    analysisEnabled &&
    (phase === "round-result" || phase === "session-result") &&
    Boolean(roundResolution || sessionResult);
  const analysisLabel = sessionResult ? "Relatório final" : "Relatório da ronda";
  const showQuickStart = !inMultiplayerRoom;

  return (
    <aside className={`app-sidebar${isOpen ? " is-open" : ""}`} aria-label="Painel lateral">
      {showQuickStart ? (
        <ButtonBase className="app-sidebar-quickstart" onClick={onQuickStart ?? onStart}>
          <span className="app-sidebar-quickstart-icon" aria-hidden="true">
            <Shuffle size={18} strokeWidth={2.2} />
          </span>
          <span className="app-sidebar-quickstart-copy">
            <strong>Missão rápida</strong>
            <span>Configuração aleatória</span>
          </span>
        </ButtonBase>
      ) : null}

      <nav className="app-sidebar-nav">
        <SidebarAction
          active={phase === "landing"}
          icon={<House size={16} strokeWidth={2} />}
          id="sidebar-home"
          onClick={onHome}
        >
          Início
        </SidebarAction>

        <SidebarAction
          active={phase === "setup"}
          disabledReason={setupDisabledReason}
          icon={<Settings2 size={16} strokeWidth={2} />}
          id="sidebar-setup"
          onClick={onStart}
        >
          Começar missão
        </SidebarAction>

        <SidebarAction
          active={phase === "multiplayer"}
          icon={<UsersRound size={16} strokeWidth={2} />}
          id="sidebar-multiplayer"
          onClick={onOpenMultiplayer}
        >
          Salas multiplayer
        </SidebarAction>

        {hasAnalysis ? (
          <SidebarAction
            active={phase === "round-result" || phase === "session-result"}
            icon={<Gauge size={16} strokeWidth={2} />}
            id="sidebar-report"
            onClick={onOpenAnalysis}
          >
            {analysisLabel}
          </SidebarAction>
        ) : null}
      </nav>

      {metrics.length > 0 ? (
        <div className="app-sidebar-meta">
          {metrics.map((metric) => (
            <div className="app-sidebar-metric" key={metric.label}>
              <span className="app-sidebar-metric-label">{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
