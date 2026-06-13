import { Compass, LocateFixed, MapPinned, Maximize2, Minimize2 } from "lucide-react";
import type { PointerEvent } from "react";
import { EuropeGuessMap } from "../../../components/EuropeGuessMap";
import { ButtonBase } from "../../../components/ui/Button";
import { RoundedButton } from "../../../components/ui/roundedButton";
import type { GuessCoordinates } from "../../../types/game";

interface RoundMinimapDockProps {
  busy: boolean;
  guess: GuessCoordinates | null;
  mapHovered: boolean;
  mapPinnedOpen: boolean;
  onGuessChange: (guess: GuessCoordinates) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onSubmit: (guess: GuessCoordinates) => Promise<void>;
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
  onSubmit,
  onTogglePinnedOpen,
  timed,
}: RoundMinimapDockProps) {
  const mapOpen = mapHovered || mapPinnedOpen;
  const mapToggleLabel = mapPinnedOpen ? "Fechar mapa" : mapOpen ? "Fixar aberto" : "Abrir mapa";

  function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      onMouseEnter();
    }
  }

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      onMouseLeave();
    }
  }

  return (
    <div
      className={`round-minimap-dock${mapOpen ? " is-expanded" : ""}${guess ? " has-guess" : ""}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <ButtonBase
        aria-expanded={mapOpen}
        aria-label={mapToggleLabel}
        className="round-minimap-toggle"
        onClick={onTogglePinnedOpen}
      >
        {mapPinnedOpen ? (
          <Minimize2 size={16} strokeWidth={2.2} />
        ) : (
          <Maximize2 size={16} strokeWidth={2.2} />
        )}
        <span>{mapToggleLabel}</span>
      </ButtonBase>

      {mapOpen ? (
        <div className="round-minimap-panel">
          <EuropeGuessMap
            compact={false}
            disabled={busy}
            guess={guess}
            onGuessChange={onGuessChange}
            showFooter={false}
          />

          <div className="round-minimap-footer">
            <div className="round-minimap-copy">
              <div className="round-minimap-copy-item">
                <MapPinned size={16} strokeWidth={2.1} />
                <span>{guess ? guess.label : "Define a posição do alvo"}</span>
              </div>

              <div className="round-minimap-copy-item">
                <LocateFixed size={16} strokeWidth={2.1} />
                <span>Mapa real da Europa</span>
              </div>

              <div className="round-minimap-copy-item">
                <Compass size={16} strokeWidth={2.1} />
                <span>{timed ? "Cronómetro ativo" : "Sessão livre"}</span>
              </div>
            </div>

            <RoundedButton
              className="round-map-submit"
              disabled={!guess || busy}
              intent="primary"
              onClick={() => {
                if (guess) {
                  void onSubmit(guess);
                }
              }}
              radius="none"
              type="button"
            >
              {busy ? "A resolver..." : "Enviar posição"}
            </RoundedButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
