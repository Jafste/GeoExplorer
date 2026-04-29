import { Compass, LocateFixed, MapPinned, Maximize2, Minimize2 } from "lucide-react";
import { EuropeGuessMap } from "../../../components/EuropeGuessMap";
import type { GuessCoordinates } from "../../../types/game";

interface RoundMinimapDockProps {
  busy: boolean;
  guess: GuessCoordinates | null;
  mapHovered: boolean;
  mapPinnedOpen: boolean;
  onGuessChange: (guess: GuessCoordinates) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTogglePinnedOpen: () => void;
  timed: boolean;
}

export function RoundMinimapDock({
  busy,
  guess,
  mapHovered,
  mapPinnedOpen,
  onGuessChange,
  onMouseEnter,
  onMouseLeave,
  onTogglePinnedOpen,
  timed,
}: RoundMinimapDockProps) {
  const mapOpen = mapHovered || mapPinnedOpen;
  const mapToggleLabel = mapPinnedOpen ? "Fechar mapa" : mapOpen ? "Fixar aberto" : "Abrir mapa";

  return (
    <div
      className={`round-minimap-dock${mapOpen ? " is-expanded" : ""}${guess ? " has-guess" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        aria-expanded={mapOpen}
        aria-label={mapToggleLabel}
        className="round-minimap-toggle"
        onClick={onTogglePinnedOpen}
        type="button"
      >
        {mapPinnedOpen ? (
          <Minimize2 size={16} strokeWidth={2.2} />
        ) : (
          <Maximize2 size={16} strokeWidth={2.2} />
        )}
        <span>{mapToggleLabel}</span>
      </button>

      <div className="round-minimap-panel">
        <EuropeGuessMap
          compact={!mapOpen}
          disabled={busy}
          guess={guess}
          onGuessChange={onGuessChange}
          showFooter={false}
        />

        <div className="round-minimap-copy">
          <div className="round-minimap-copy-item">
            <MapPinned size={16} strokeWidth={2.1} />
            <span>{guess ? guess.label : "Abre e clica no mapa para marcar"}</span>
          </div>

          <div className="round-minimap-copy-item">
            <LocateFixed size={16} strokeWidth={2.1} />
            <span>{mapOpen ? "Mapa real da Europa" : "Mapa recolhido"}</span>
          </div>

          <div className="round-minimap-copy-item">
            <Compass size={16} strokeWidth={2.1} />
            <span>{timed ? "Cronómetro ativo" : "Sessão livre"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
