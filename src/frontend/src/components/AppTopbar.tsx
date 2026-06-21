import { House, Menu, Play, ScrollText } from "lucide-react";
import type { SurfacePhase } from "../app/navigation";
import { ButtonBase, IconButton } from "./ui/Button";
import { RoundedButton } from "./ui/roundedButton";

interface AppTopbarProps {
  phase: SurfacePhase;
  showSidebarToggle: boolean;
  sidebarOpen: boolean;
  onHome: () => void;
  onOpenTutorial: () => void;
  onStart: () => void;
  onToggleSidebar: () => void;
}

export function AppTopbar({
  phase,
  showSidebarToggle,
  sidebarOpen,
  onHome,
  onOpenTutorial,
  onStart,
  onToggleSidebar,
}: AppTopbarProps) {
  const isLanding = phase === "landing";
  const isRound = phase === "round";

  return (
    <header className={`topbar${isRound ? " topbar--play" : ""}`}>
      {showSidebarToggle ? (
        <IconButton
          aria-expanded={sidebarOpen}
          className="topbar-menu-button"
          label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
        >
          <Menu size={19} strokeWidth={2.2} />
        </IconButton>
      ) : null}

      <ButtonBase
        aria-label="Ir para o início"
        className={`brand brand-button${isRound ? " brand-button--play" : ""}`}
        onClick={onHome}
      >
        <img alt="" aria-hidden="true" className="brand-mark" height={34} src="/favicon.png" width={34} />
        <span className="brand-copy">
          <span className="brand-title">GeoExplorer</span>
        </span>
      </ButtonBase>

      <div className={`topbar-actions`}>
        <RoundedButton
          aria-label="Abrir tutorial"
          color="neon"
          onClick={onOpenTutorial}
          radius="none"
          size="sm"
          title="Abrir tutorial"
          tone="ghost"
          type="button"
        >
          <ScrollText size={16} strokeWidth={2.2} />
          Tutorial
        </RoundedButton>
        {isLanding ? (
          <RoundedButton
            aria-label="Começar missão"
            className="gap-2"
            intent="primary"
            onClick={onStart}
            radius="none"
            size="md"
            title="Começar missão"
            tone="soft"
            type="button"
          >
            <Play size={16} strokeWidth={2.2} />
            Começar
          </RoundedButton>
        ) : (
          <RoundedButton
            aria-label="Ir para o início"
            intent="primary"
            onClick={onHome}
            radius="none"
            size="md"
            title="Ir para o início"
            tone="solid"
            type="button"
          >
            <House size={16} strokeWidth={2.2} />
            Início
          </RoundedButton>
        )}
      </div>
    </header>
  );
}
