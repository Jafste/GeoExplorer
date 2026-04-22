import type { ChallengeRound, GuessCoordinates } from "../../../types/game";
import { formatCategoryLabel } from "../utils/roundFormat";

interface RoundBriefingPanelProps {
  busy: boolean;
  guess: GuessCoordinates | null;
  onSubmit: (guess: GuessCoordinates) => Promise<void>;
  round: ChallengeRound;
}

export function RoundBriefingPanel({
  busy,
  guess,
  onSubmit,
  round,
}: RoundBriefingPanelProps) {
  return (
    <aside className="round-briefing-panel">
      <div className="round-briefing-head">
        <span className="muted-eyebrow">Ronda ativa</span>
        <h2>{round.challenge.title}</h2>
        <p>{round.challenge.prompt}</p>
      </div>

      <div className="round-briefing-meta">
        <div className="round-briefing-meta-item">
          <span className="muted-eyebrow">Perfil</span>
          <strong>{formatCategoryLabel(round.challenge.category)}</strong>
          <span>Leitura visual em terreno europeu</span>
        </div>

        <div className="round-briefing-meta-item">
          <span className="muted-eyebrow">Ritmo</span>
          <strong>{round.timed ? "Cronómetro ativo" : "Sem cronómetro"}</strong>
          <span>Uma única colocação no mapa</span>
        </div>
      </div>

      <div className="round-briefing-clues">
        {round.challenge.clues.map((clue) => (
          <div className="round-briefing-clue" key={clue.label}>
            <div>
              <span className="muted-eyebrow">{clue.label}</span>
              <strong>{clue.value}</strong>
            </div>
            <span className="round-briefing-confidence">{clue.confidence}</span>
          </div>
        ))}
      </div>

      <div className="round-pin-panel">
        <div>
          <span className="muted-eyebrow">Pino atual</span>
          <strong>{guess ? guess.label : "Sem marcação"}</strong>
          <p>
            {guess
              ? `${guess.latitude.toFixed(2)} / ${guess.longitude.toFixed(2)}`
              : "Abre o minimapa e marca um ponto aproximado na Europa."}
          </p>
        </div>

        <button
          className="button button-primary round-play-submit"
          disabled={!guess || busy}
          onClick={() => {
            if (guess) {
              void onSubmit(guess);
            }
          }}
          type="button"
        >
          {busy ? "A resolver..." : "Enviar palpite"}
        </button>
      </div>
    </aside>
  );
}
