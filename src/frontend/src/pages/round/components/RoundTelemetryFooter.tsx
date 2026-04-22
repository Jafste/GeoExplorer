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
    <div className={`round-telemetry-footer${mapOpen ? " is-collapsed" : ""}`} aria-label="Telemetria da missão">
      <div className="round-telemetry-segment">
        <span className="muted-eyebrow">Setor</span>
        <strong>{formatCategoryLabel(round.challenge.category)}</strong>
        <span>{round.challenge.sceneLabel}</span>
      </div>

      <div className="round-telemetry-segment round-telemetry-segment--icon">
        <Radar size={16} strokeWidth={2.1} />
        <div>
          <span className="muted-eyebrow">Sinal dominante</span>
          <strong>{primaryClue?.label ?? "Observação"}</strong>
        </div>
      </div>

      <div className="round-telemetry-segment round-telemetry-segment--icon">
        <MapPinned size={16} strokeWidth={2.1} />
        <div>
          <span className="muted-eyebrow">Pino</span>
          <strong>{guess ? guess.label : "Sem marcação"}</strong>
        </div>
      </div>

      <div className="round-telemetry-segment round-telemetry-segment--icon">
        {round.timed ? <TimerReset size={16} strokeWidth={2.1} /> : <Crosshair size={16} strokeWidth={2.1} />}
        <div>
          <span className="muted-eyebrow">Operação</span>
          <strong>
            {round.timed && remainingSeconds !== null
              ? `${formatSeconds(remainingSeconds)} restantes`
              : "Janela livre"}
          </strong>
          <span>{mapOpen ? "Minimapa ativo" : "Painel de mapa recolhido"}</span>
        </div>
      </div>
    </div>
  );
}
