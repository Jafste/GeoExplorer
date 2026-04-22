import { House, Play, Radar, ScrollText } from "lucide-react";
import type { SurfacePhase } from "../app/navigation";
import type { SessionConfig } from "../types/game";

interface AppTopbarProps {
  config: SessionConfig;
  phase: SurfacePhase;
  onHome: () => void;
  onOpenTutorial: () => void;
  onStart: () => void;
}

function getModeLabel(config: SessionConfig) {
  return config.timed ? `${config.roundTimeSeconds ?? 0}s` : "Livre";
}

function getPhaseLabel(phase: SurfacePhase) {
  switch (phase) {
    case "landing":
      return "Centro de missão";
    case "setup":
      return "Configuração";
    case "round":
      return "Missão ativa";
    case "round-result":
      return "Resumo da ronda";
    case "session-result":
      return "Relatório final";
  }
}

export function AppTopbar({
  config,
  phase,
  onHome,
  onOpenTutorial,
  onStart,
}: AppTopbarProps) {
  const isLanding = phase === "landing";
  const isRound = phase === "round";

  return (
    <header className={`topbar${isRound ? " topbar--play" : ""}`}>
      <button
        aria-label="Voltar ao início"
        className={`brand brand-button${isRound ? " brand-button--play" : ""}`}
        onClick={onHome}
        type="button"
      >
        <span className="brand-mark" />
        <span className="brand-copy">
          <span className="brand-title">GeoExplorer // TAC-OPS</span>
          <span className="brand-subtitle">Treino geográfico europeu</span>
        </span>
      </button>

      {!isRound ? (
        <div className="topbar-center" aria-label="Modo atual">
          <span className="hud-pill hud-pill-active">
            <Radar size={14} strokeWidth={2.1} />
            {getPhaseLabel(phase)}
          </span>
          <span className="hud-pill hud-pill-quiet">Europa</span>
          <span className="hud-pill hud-pill-quiet">
            {isLanding ? "Com ou sem cronómetro" : getModeLabel(config)}
          </span>
        </div>
      ) : null}

      <div className={`topbar-actions${isRound ? " topbar-actions--play" : ""}`}>
        <button className="button button-ghost button-compact" onClick={onOpenTutorial} type="button">
          <ScrollText size={16} strokeWidth={2.2} />
          Tutorial
        </button>

        {isLanding ? (
          <button className="button button-primary button-compact" onClick={onStart} type="button">
            <Play size={16} strokeWidth={2.2} />
            Iniciar
          </button>
        ) : (
          <button className="button button-subtle button-compact" onClick={onHome} type="button">
            <House size={16} strokeWidth={2.2} />
            Base
          </button>
        )}
      </div>
    </header>
  );
}
