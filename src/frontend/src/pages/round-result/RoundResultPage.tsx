import { MapPinned, MoveRight, Radar, ScanLine, Waypoints } from "lucide-react";
import { EuropeGuessMap } from "../../components/EuropeGuessMap";
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
  const accuracy =
    result.distanceKm === null ? 0 : Math.max(0, Math.min(100, Math.round((result.score / 5000) * 1000) / 10));
  const verdict =
    result.resolution === "timeout"
      ? "Janela perdida"
      : result.score >= 4500
        ? "Leitura cirúrgica"
        : result.score >= 3000
          ? "Contacto sólido"
          : "Desvio registado";
  const actualLocation = {
    latitude: result.correctLatitude,
    longitude: result.correctLongitude,
    label: `${result.city}, ${result.country}`,
  };

  return (
    <section className="screen-shell screen-shell-debrief">
      <div className="section-header">
        <div>
          <div className="eyebrow">resumo da ronda</div>
          <h2 className="section-title">Resultado confirmado.</h2>
        </div>
        <button className="button button-ghost" onClick={onHome} type="button">
          Voltar à base
        </button>
      </div>

      <div className="debrief-layout">
        <article className="debrief-map-card">
          <div className="debrief-map-head">
            <div>
              <span className="muted-eyebrow">Comparação cartográfica</span>
              <h3>Traçado da ronda {result.roundNumber}</h3>
            </div>

            <div className="result-chip-row">
              <span className="chip chip-soft">Setor europeu</span>
              <span className="chip chip-highlight">{result.resolution === "timeout" ? "Tempo esgotado" : "Marcação confirmada"}</span>
            </div>
          </div>

          <div className="debrief-map-stage">
            <EuropeGuessMap
              actual={actualLocation}
              comparisonDistanceKm={result.distanceKm}
              disabled
              guess={result.guess}
              onGuessChange={() => undefined}
              showComparisonLine={Boolean(result.guess && result.distanceKm !== null)}
              showFooter={false}
              showMarkerLabels={Boolean(result.guess)}
            />
          </div>

          <div className="debrief-map-ticker">
            <div className="debrief-map-ticker-item">
              <MapPinned size={16} strokeWidth={2} />
              <div>
                <span className="muted-eyebrow">Local confirmado</span>
                <strong>{result.city}, {result.country}</strong>
              </div>
            </div>

            <div className="debrief-map-ticker-item">
              <Radar size={16} strokeWidth={2} />
              <div>
                <span className="muted-eyebrow">Coordenadas</span>
                <strong>
                  {result.correctLatitude.toFixed(2)} / {result.correctLongitude.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="debrief-map-ticker-item">
              <Waypoints size={16} strokeWidth={2} />
              <div>
                <span className="muted-eyebrow">Vetor do teu pino</span>
                <strong>{result.guess ? `${result.guess.latitude.toFixed(2)} / ${result.guess.longitude.toFixed(2)}` : "Sem vetor registado"}</strong>
              </div>
            </div>

            <div className="debrief-map-ticker-item">
              <ScanLine size={16} strokeWidth={2} />
              <div>
                <span className="muted-eyebrow">Resolução</span>
                <strong>{result.resolution === "timeout" ? "Fecho automático" : "Submissão manual"}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="debrief-summary-card">
          <div className="debrief-summary-head">
            <div>
              <span className="muted-eyebrow">Resultado da missão</span>
              <h3>{verdict}</h3>
            </div>
            <span className="chip chip-highlight">
              {result.resolution === "timeout" ? "Resolvida por tempo" : "Submissão manual"}
            </span>
          </div>

          <div className="debrief-score-block">
            <span className="muted-eyebrow">Pontuação adquirida</span>
            <strong>{result.score.toLocaleString("pt-PT")} pts</strong>
          </div>

          <div className="debrief-metric-grid">
            <div className="debrief-metric-card">
              <span className="muted-eyebrow">Precisão</span>
              <strong>{accuracy.toFixed(1)}%</strong>
            </div>
            <div className="debrief-metric-card">
              <span className="muted-eyebrow">Desvio</span>
              <strong>{result.distanceKm === null ? "Sem dados" : `${result.distanceKm.toFixed(1)} km`}</strong>
            </div>
          </div>

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
              <strong>Leitura da ronda</strong>
              <p>
                {result.distanceKm === null
                  ? "O cronómetro terminou antes da marcação."
                  : `${result.distanceKm.toFixed(1)} km de diferença entre o teu ponto e o alvo.`}
              </p>
            </div>
          </div>

          <div className="debrief-intel-log">
            <div className="debrief-intel-log-head">
              <span className="muted-eyebrow">Intel da ronda</span>
              <span className="chip chip-soft">{result.clues.length} sinais</span>
            </div>

            <div className="debrief-intel-list">
              {result.clues.map((clue) => (
                <div className="debrief-intel-item" key={clue.label}>
                  <div>
                    <span className="muted-eyebrow">{clue.label}</span>
                    <strong>{clue.value}</strong>
                  </div>
                  <span className="debrief-intel-confidence">{clue.confidence}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="action-row action-row-spread">
        <button className="button button-ghost" onClick={onHome} type="button">
          Terminar sessão
        </button>
        <button className="button button-primary" disabled={busy} onClick={onContinue} type="button">
          {busy
            ? "A carregar..."
            : progress.completed
              ? "Ver relatório final"
              : (
                <>
                  Ir para a ronda {progress.nextRoundNumber}
                  <MoveRight size={16} strokeWidth={2.2} />
                </>
              )}
        </button>
      </div>
    </section>
  );
}
