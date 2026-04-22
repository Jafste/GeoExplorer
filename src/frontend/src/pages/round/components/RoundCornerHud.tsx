import { Clock3, Crosshair, LocateFixed } from "lucide-react";
import type { GuessCoordinates } from "../../../types/game";

interface RoundCornerHudProps {
  guess: GuessCoordinates | null;
  mapOpen: boolean;
  timed: boolean;
}

export function RoundCornerHud({ guess, mapOpen, timed }: RoundCornerHudProps) {
  return (
    <div className="round-corner-hud">
      <span className="muted-eyebrow round-corner-hud-kicker">Telemetria tática</span>

      <div className="round-corner-hud-track">
        <div className="round-corner-hud-item">
          <div className="round-corner-hud-item-head">
            <Crosshair size={15} strokeWidth={2.1} />
            <span>Pino</span>
          </div>
          <strong>{guess ? "Pino fixado" : "Um ponto livre"}</strong>
        </div>

        <div className="round-corner-hud-item">
          <div className="round-corner-hud-item-head">
            <LocateFixed size={15} strokeWidth={2.1} />
            <span>Mapa</span>
          </div>
          <strong>{mapOpen ? "Painel aberto" : "Painel recolhido"}</strong>
        </div>

        <div className="round-corner-hud-item">
          <div className="round-corner-hud-item-head">
            <Clock3 size={15} strokeWidth={2.1} />
            <span>Tempo</span>
          </div>
          <strong>{timed ? "Tempo ativo" : "Sem limite"}</strong>
        </div>
      </div>
    </div>
  );
}
