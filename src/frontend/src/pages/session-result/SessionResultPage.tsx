import { useDeferredValue } from "react";
import type { SessionConfig, SessionResult } from "../../types/game";

interface SessionResultPageProps {
  busy: boolean;
  config: SessionConfig;
  result: SessionResult;
  onReplay: () => void;
  onHome: () => void;
}

export function SessionResultPage({
  busy,
  config,
  result,
  onReplay,
  onHome,
}: SessionResultPageProps) {
  const deferredRounds = useDeferredValue(result.rounds);
  const averageScore =
    result.rounds.length > 0 ? Math.round(result.totalScore / result.rounds.length) : 0;

  return (
    <section className="screen-shell">
      <div className="section-header">
        <div>
          <div className="eyebrow">session summary</div>
          <h2 className="section-title">Session complete.</h2>
        </div>
      </div>

      <div className="summary-hero">
        <div className="metric-card metric-card-large">
          <span>Pontuacao total</span>
          <strong>{result.totalScore.toLocaleString("pt-PT")} pts</strong>
        </div>
        <div className="metric-card">
          <span>Media por ronda</span>
          <strong>{averageScore.toLocaleString("pt-PT")} pts</strong>
        </div>
        <div className="metric-card">
          <span>Modo</span>
          <strong>{config.timed ? `${config.roundTimeSeconds}s` : "Livre"}</strong>
        </div>
        <div className="metric-card">
          <span>Rondas</span>
          <strong>{result.totalRounds}</strong>
        </div>
      </div>

      <article className="panel-card">
        <span className="muted-eyebrow">Detalhe por ronda</span>
        <div className="summary-table">
          {deferredRounds.map((round) => (
            <div className="summary-row" key={round.roundId}>
              <div>
                <strong>
                  Ronda {round.roundNumber} · {round.city}
                </strong>
                <p>
                  {round.guess ? round.guess.label : "Sem palpite"} ·{" "}
                  {round.distanceKm === null ? "Timeout sem resposta" : `${round.distanceKm.toFixed(1)} km`}
                </p>
              </div>
              <span>{round.score.toLocaleString("pt-PT")} pts</span>
            </div>
          ))}
        </div>
      </article>

      <div className="action-row action-row-spread">
        <button className="button button-ghost" onClick={onHome} type="button">
          Back home
        </button>
        <button className="button button-primary" disabled={busy} onClick={onReplay} type="button">
          {busy ? "Restarting..." : "Play again"}
        </button>
      </div>
    </section>
  );
}
