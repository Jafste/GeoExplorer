import { CircleHelp, House, Play } from "lucide-react";
import type { SessionConfig } from "../types/game";

type SurfacePhase = "landing" | "setup" | "round" | "round-result" | "session-result";

interface AppTopbarProps {
  config: SessionConfig;
  phase: SurfacePhase;
  onHome: () => void;
  onOpenTutorial: () => void;
  onStart: () => void;
}

function getModeLabel(config: SessionConfig) {
  return config.timed ? `${config.roundTimeSeconds ?? 0}s timer` : "untimed";
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
          <span className="brand-title">GeoExplorer</span>
          <span className="brand-subtitle">Explore Europe</span>
        </span>
      </button>

      {!isRound ? (
        <div className="topbar-center" aria-label="Modo atual">
          <span className="hud-pill">Classic solo</span>
          <span className="hud-pill hud-pill-quiet">Europe</span>
          <span className="hud-pill hud-pill-quiet">
            {isLanding ? "Timed optional" : getModeLabel(config)}
          </span>
        </div>
      ) : null}

      <div className={`topbar-actions${isRound ? " topbar-actions--play" : ""}`}>
        <button className="button button-ghost button-compact" onClick={onOpenTutorial} type="button">
          <CircleHelp size={16} strokeWidth={2.2} />
          How to play
        </button>

        {isLanding ? (
          <button className="button button-primary button-compact" onClick={onStart} type="button">
            <Play size={16} strokeWidth={2.2} />
            Play now
          </button>
        ) : (
          <button className="button button-subtle button-compact" onClick={onHome} type="button">
            <House size={16} strokeWidth={2.2} />
            Home
          </button>
        )}
      </div>
    </header>
  );
}
