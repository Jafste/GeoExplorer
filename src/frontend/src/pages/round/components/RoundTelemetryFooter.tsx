import { Crosshair, MapPinned, Radar, TimerReset } from "lucide-react";
import type { ChallengeRound, GuessCoordinates } from "../../../types/game";
import { formatCategoryLabel, formatSeconds } from "../utils/roundFormat";

interface RoundTelemetryFooterProps {
  guess: GuessCoordinates | null;
  mapOpen: boolean;
  remainingSeconds: number | null;
  round: ChallengeRound;
}

export function RoundTelemetryFooter({
  guess,
  mapOpen,
  remainingSeconds,
  round,
}: RoundTelemetryFooterProps) {
  const primaryClue = round.challenge.clues[0];

  return (
    <div className={`round-telemetry-footer${mapOpen ? " is-collapsed" : ""}`} aria-label="Estado da missão">
      <div className="round-telemetry-segment">
        <span className="muted-eyebrow">Setor do alvo</span>
        <strong>{formatCategoryLabel(round.challenge.category)}</strong>
        <span>{round.challenge.sceneLabel}</span>
      </div>

      <div className="round-telemetry-segment round-telemetry-segment--icon">
        <Radar size={16} strokeWidth={2.1} />
        <div>
          <span className="muted-eyebrow">Pista principal</span>
          <strong>{primaryClue?.label ?? "Observação"}</strong>
        </div>
      </div>

      <div className="round-telemetry-segment round-telemetry-segment--icon">
        <MapPinned size={16} strokeWidth={2.1} />
        <div>
          <span className="muted-eyebrow">Posição</span>
          <strong>{guess ? guess.label : "Por definir"}</strong>
        </div>
      </div>

      <div className="round-telemetry-segment round-telemetry-segment--icon">
        {round.timed ? <TimerReset size={16} strokeWidth={2.1} /> : <Crosshair size={16} strokeWidth={2.1} />}
        <div>
          <span className="muted-eyebrow">Tempo</span>
          <strong>
            {round.timed && remainingSeconds !== null
              ? `${formatSeconds(remainingSeconds)} restantes`
              : "Janela livre"}
          </strong>
          <span>{mapOpen ? "Mapa aberto" : "Mapa recolhido"}</span>
        </div>
      </div>
    </div>
  );
}
