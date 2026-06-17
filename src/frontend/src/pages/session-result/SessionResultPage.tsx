import { MoveRight } from "lucide-react";
import { useDeferredValue } from "react";
import { EuropeGuessMap, type MapHotspot } from "../../components/EuropeGuessMap";
import { Card } from "../../components/layout/card/card";
import { InfoGrid } from "../../components/ui/InfoCard";
import { RoundedButton } from "../../components/ui/roundedButton";
import type { SessionConfig, SessionResult } from "../../types/game";
import { getSessionMissionOutcome } from "./sessionMissionOutcome";

interface SessionResultPageProps {
  busy: boolean;
  config: SessionConfig;
  result: SessionResult;
  onReplay: () => void;
}

export function SessionResultPage({
  busy,
  config,
  result,
  onReplay,
}: SessionResultPageProps) {
  const deferredRounds = useDeferredValue(result.rounds);
  const roundsWithDistance = result.rounds.filter((round) => round.distanceKm !== null);
  const averageScore =
    result.rounds.length > 0 ? Math.round(result.totalScore / result.rounds.length) : 0;
  const averageDistance =
    roundsWithDistance.length > 0
      ? roundsWithDistance.reduce((sum, round) => sum + (round.distanceKm ?? 0), 0) /
        roundsWithDistance.length
      : null;
  const perfectStrikes = result.rounds.filter((round) => round.score >= 4900).length;
  const bestRound =
    result.rounds.length > 0
      ? result.rounds.reduce((best, round) => (round.score > best.score ? round : best), result.rounds[0])
      : null;
  const missionOutcome = getSessionMissionOutcome({
    config,
    totalRounds: result.totalRounds,
    totalScore: result.totalScore,
  });
  const sessionVerdict =
    averageScore >= 4500
      ? "Leitura excecional"
      : averageScore >= 3200
        ? "Sessão sólida"
        : "Reconhecimento irregular";
  const timeoutRounds = result.rounds.filter((round) => round.resolution === "timeout").length;
  const hotspots: MapHotspot[] = result.rounds.map((round) => ({
    label: `R${round.roundNumber} · ${round.city}`,
    latitude: round.correctLatitude,
    longitude: round.correctLongitude,
    tone: round.distanceKm === null ? "danger" : round.score >= 4500 ? "primary" : "neutral",
    value: `${round.score.toLocaleString("pt-PT")} pts`,
  }));

  return (
    <section className="screen-shell screen-shell-session-report">
      <div className="session-report-top">
        <div className="section-header session-report-heading">
          <div>
            <div className="session-outcome-kicker">
              <div className="eyebrow">relatório final</div>
              <span className={`chip ${missionOutcome.success ? "chip-highlight" : "chip-soft"}`}>
                {missionOutcome.status}
              </span>
            </div>
            <h2 className="section-title">{missionOutcome.title}</h2>
            <p className="section-support">
              {missionOutcome.summary}
            </p>
          </div>
        </div>

        <div className="summary-hero session-report-summary">
          <div className="metric-card">
            <span>Pontuação total</span>
            <strong>{result.totalScore.toLocaleString("pt-PT")} pts</strong>
          </div>
          <div className="metric-card">
            <span>Média por ronda</span>
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
      </div>

      <InfoGrid
        items={[
          { label: "Diagnóstico", value: sessionVerdict },
          { label: "Objetivo", value: `${missionOutcome.targetScore.toLocaleString("pt-PT")} pts` },
          { label: "Tempos esgotados", value: `${timeoutRounds} ocorrência(s)` },
        ]}
      />

      <div className="session-report-grid">
        <Card as="article" variant="tacticalStack">
          <div className="session-map-card-head">
            <div>
              <span className="muted-eyebrow">Mapa dos alvos</span>
              <h3>Dispersão da missão</h3>
            </div>
          </div>

          <div className="session-map-stage">
            <EuropeGuessMap
              disabled
              guess={bestRound?.guess ?? null}
              hotspots={[...hotspots]}
              onGuessChange={() => undefined}
              showFooter={false}
            />
          </div>

          <div className="session-map-legend">
            <div className="session-map-legend-item">
              <span className="session-map-legend-dot session-map-legend-dot--primary" />
              <span>Alta precisão</span>
            </div>
            <div className="session-map-legend-item">
              <span className="session-map-legend-dot session-map-legend-dot--neutral" />
              <span>Leitura intermédia</span>
            </div>
            <div className="session-map-legend-item">
              <span className="session-map-legend-dot session-map-legend-dot--danger" />
              <span>Tempo esgotado</span>
            </div>
          </div>
        </Card>

        <Card as="article" variant="tacticalStack">
          <span className="muted-eyebrow">Performance consolidada</span>

          <InfoGrid
            layout="stack"
            items={[
              {
                label: "Distância média",
                value: averageDistance === null ? "Sem dados" : `${averageDistance.toFixed(1)} km`,
              },
              { label: "Quase perfeitas", value: `${perfectStrikes} / ${result.totalRounds}` },
              {
                label: "Melhor ronda",
                value: bestRound ? `R${bestRound.roundNumber} · ${bestRound.city}` : "Sem dados",
              },
            ]}
          />

          <div className="session-report-actions">
            <RoundedButton intent="primary" radius="none" disabled={busy} onClick={onReplay} type="button">
              {busy ? "A reiniciar..." : (
                <>
                  Nova missão
                  <MoveRight size={16} strokeWidth={2.2} />
                </>
              )}
            </RoundedButton>
          </div>
        </Card>
      </div>

      <Card as="article" variant="setupPanelStack" className="session-log-card">
        <div className="session-log-header">
          <span className="muted-eyebrow">Alvos analisados</span>
          <span className="chip chip-soft">{result.totalRounds} rondas</span>
        </div>

        <div className="summary-table">
          {deferredRounds.map((round) => (
            <div className="summary-row summary-row-report" key={round.roundId}>
              <div className="summary-row-index">{round.roundNumber}</div>

              <div className="summary-row-main">
                <strong>
                  {round.city}, {round.country}
                </strong>
                <p>
                  {round.guess ? round.guess.label : "Sem posição"} ·{" "}
                  {round.distanceKm === null ? "Tempo esgotado" : `${round.distanceKm.toFixed(1)} km`}
                </p>
                {round.media ? (
                  <span className="summary-row-source">
                    {round.media.sourceProvider}
                    {round.media.imageLicense ? ` · ${round.media.imageLicense}` : ""}
                  </span>
                ) : null}
                <span className={`summary-row-badge${round.resolution === "timeout" ? " is-danger" : round.score >= 4500 ? " is-primary" : ""}`}>
                  {round.resolution === "timeout"
                    ? "Tempo esgotado"
                    : round.score >= 4500
                      ? "Alta precisão"
                      : "Leitura válida"}
                </span>
              </div>

              <div className="summary-row-metric">
                <span className="muted-eyebrow">Pontuação</span>
                <strong>{round.score.toLocaleString("pt-PT")} pts</strong>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </section>
  );
}
