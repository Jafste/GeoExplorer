import type { RoundProgress, RoundResult } from "../../types/game";

interface RoundResultPageProps {
  busy: boolean;
  progress: RoundProgress;
  result: RoundResult;
  onContinue: () => void;
  onHome: () => void;
}

export function RoundResultPage({
  busy,
  progress,
  result,
  onContinue,
  onHome,
}: RoundResultPageProps) {
  return (
    <section className="screen-shell">
      <div className="section-header">
        <div>
          <div className="eyebrow">round feedback</div>
          <h2 className="section-title">Round locked in.</h2>
        </div>
        <button className="button button-ghost" onClick={onHome} type="button">
          Back home
        </button>
      </div>

      <div className="result-grid">
        <article className="result-highlight">
          <span className="muted-eyebrow">Pontuacao da ronda</span>
          <strong>{result.score.toLocaleString("pt-PT")} pts</strong>
          <p>
            {result.distanceKm === null
              ? "The timer closed the round before a pin was locked."
              : `${result.distanceKm.toFixed(1)} km from the correct location.`}
          </p>
          <div className="result-chip-row">
            <span className="chip chip-highlight">
              {result.resolution === "timeout" ? "Resolvida por timeout" : "Submissao manual"}
            </span>
            <span className="chip chip-soft">{result.city}</span>
            <span className="chip chip-soft">{result.country}</span>
          </div>
        </article>

        <article className="panel-card">
          <span className="muted-eyebrow">Comparacao</span>
          <div className="comparison-table">
            <div>
              <strong>Local correto</strong>
              <p>
                {result.city}, {result.country}
              </p>
            </div>
            <div>
              <strong>O teu palpite</strong>
              <p>{result.guess ? result.guess.label : "Sem palpite"}</p>
            </div>
            <div>
              <strong>Distancia</strong>
              <p>{result.distanceKm === null ? "N/A" : `${result.distanceKm.toFixed(1)} km`}</p>
            </div>
          </div>
        </article>
      </div>

      <div className="action-row action-row-spread">
        <button className="button button-ghost" onClick={onHome} type="button">
          End session
        </button>
        <button className="button button-primary" disabled={busy} onClick={onContinue} type="button">
          {busy
            ? "A carregar..."
            : progress.completed
              ? "Ver resultado final"
              : `Ir para ronda ${progress.nextRoundNumber}`}
        </button>
      </div>
    </section>
  );
}
