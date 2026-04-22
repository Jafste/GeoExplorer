import { Compass, Gauge, House, ScrollText, Settings2 } from "lucide-react";
import type { SurfacePhase } from "../app/navigation";
import type { SessionConfig } from "../types/game";

interface AppSidebarProps {
  analysisEnabled: boolean;
  config: SessionConfig;
  phase: SurfacePhase;
  onHome: () => void;
  onOpenAnalysis: () => void;
  onOpenTutorial: () => void;
  onStart: () => void;
}

function getTimerLabel(config: SessionConfig) {
  return config.timed ? `${config.roundTimeSeconds ?? 0}s` : "Livre";
}

export function AppSidebar({
  analysisEnabled,
  config,
  phase,
  onHome,
  onOpenAnalysis,
  onOpenTutorial,
  onStart,
}: AppSidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="Painel lateral">
      <div className="app-sidebar-profile">
        <div className="app-sidebar-avatar">
          <Compass size={18} strokeWidth={2} />
        </div>

        <div className="app-sidebar-profile-copy">
          <span className="app-sidebar-kicker">EU-SECTOR-01</span>
          <strong>GeoExplorer</strong>
          <span>Treino OSINT · Europa</span>
        </div>
      </div>

      <nav className="app-sidebar-nav">
        <button
          className={`app-sidebar-link${phase === "landing" ? " is-active" : ""}`}
          onClick={onHome}
          type="button"
        >
          <House size={16} strokeWidth={2} />
          <span>Centro de missão</span>
        </button>

        <button
          className={`app-sidebar-link${phase === "setup" ? " is-active" : ""}`}
          onClick={onStart}
          type="button"
        >
          <Settings2 size={16} strokeWidth={2} />
          <span>Configuração</span>
        </button>

        <button
          className={`app-sidebar-link${phase === "round-result" || phase === "session-result" ? " is-active" : ""}`}
          disabled={!analysisEnabled}
          onClick={onOpenAnalysis}
          type="button"
        >
          <Gauge size={16} strokeWidth={2} />
          <span>Análise</span>
        </button>

        <button className="app-sidebar-link" onClick={onOpenTutorial} type="button">
          <ScrollText size={16} strokeWidth={2} />
          <span>Tutorial</span>
        </button>
      </nav>

      <div className="app-sidebar-meta">
        <div className="app-sidebar-metric">
          <span className="app-sidebar-metric-label">Modo</span>
          <strong>Solo clássico</strong>
        </div>

        <div className="app-sidebar-metric">
          <span className="app-sidebar-metric-label">Ritmo</span>
          <strong>{getTimerLabel(config)}</strong>
        </div>

        <div className="app-sidebar-metric">
          <span className="app-sidebar-metric-label">Âmbito</span>
          <strong>Europa</strong>
        </div>
      </div>
    </aside>
  );
}
