import { ExternalLink, MapPinned, MoveRight, Radar, Waypoints } from "lucide-react";
import { formatDistanceKm, formatScore } from "../../app/format";
import { EuropeGuessMap } from "../../components/EuropeGuessMap";
import { Card } from "../../components/layout/card/card";
import { InfoGrid } from "../../components/ui/InfoCard";
import { RoundedButton } from "../../components/ui/roundedButton";
import type { RoundProgress, RoundResult } from "../../types/game";

interface RoundResultPageProps {
  busy: boolean;
  progress: RoundProgress;
  result: RoundResult;
  showTotalScore?: boolean;
  totalScore?: number;
  onContinue: () => void;
}

export function RoundResultPage({
  busy,
  progress,
  result,
  showTotalScore = false,
  totalScore,
  onContinue,
}: RoundResultPageProps) {
  const accuracy =
    result.distanceKm === null ? 0 : Math.max(0, Math.min(100, Math.round((result.score / 5000) * 1000) / 10));
  const verdict =
    result.resolution === "timeout"
      ? "Tempo esgotado"
      : result.score >= 4500
        ? "Muito perto"
        : result.score >= 3000
          ? "Boa leitura"
          : "Longe do alvo";
  const actualLocation = {
    latitude: result.correctLatitude,
    longitude: result.correctLongitude,
    label: `${result.city}, ${result.country}`,
  };
  const sourceUrl = result.media?.imageSourceUrl?.trim();
  const licenseUrl = result.media?.imageLicenseUrl?.trim().replace(/^http:\/\//, "https://");

  return (
    <section className="screen-shell screen-shell-debrief">
      <div className="section-header debrief-page-header">
        <div>
          <div className="eyebrow">debrief da ronda</div>
          <h2 className="section-title">Alvo confirmado.</h2>
        </div>
        <div className="debrief-header-actions">
          <RoundedButton intent="primary" radius="none" disabled={busy} onClick={onContinue} type="button">
            {busy
              ? "A carregar…"
              : progress.completed
                ? "Ver relatório final"
                : (
                  <>
                    Ir para a ronda {progress.nextRoundNumber}
                    <MoveRight size={16} strokeWidth={2.2} />
                  </>
                )}
          </RoundedButton>
        </div>
      </div>

      <div className="debrief-layout">
        <Card as="article" variant="tactical">
          <div className="debrief-map-head">
            <div>
              <span className="muted-eyebrow">Comparação cartográfica</span>
              <h3>Traçado da ronda {result.roundNumber}</h3>
            </div>

            <div className="result-chip-row">
              <span className="chip chip-highlight">{result.resolution === "timeout" ? "Tempo esgotado" : "Marcação confirmada"}</span>
            </div>
          </div>

          <div className="debrief-map-stage">
            <EuropeGuessMap
              actual={actualLocation}
              comparisonDistanceKm={result.distanceKm}
              disabled
              fitToMarkers
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
                <span className="muted-eyebrow">Posição enviada</span>
                <strong>{result.guess ? `${result.guess.latitude.toFixed(2)} / ${result.guess.longitude.toFixed(2)}` : "Sem ponto registado"}</strong>
              </div>
            </div>
          </div>
        </Card>

        <Card as="article" variant="tacticalStack">
          <div className="debrief-summary-head">
            <div>
              <span className="muted-eyebrow">Resultado da ronda</span>
              <h3>{verdict}</h3>
            </div>
          </div>

          <div className="debrief-score-block">
            <span className="muted-eyebrow">Pontuação</span>
            <strong>{showTotalScore ? `+${formatScore(result.score)}` : formatScore(result.score)}</strong>
            {showTotalScore ? <small>Total {formatScore(totalScore)}</small> : null}
          </div>

          <InfoGrid
            layout="preview"
            items={[
              { label: "Precisão", value: `${accuracy.toFixed(1)}%` },
              {
                label: "Desvio",
                value: formatDistanceKm(result.distanceKm),
              },
            ]}
          />

          <div className="comparison-table">
            <div>
              <strong>Local correto</strong>
              <p>
                {result.city}, {result.country}
              </p>
            </div>
            <div>
              <strong>Posição enviada</strong>
              <p>{result.guess ? result.guess.label : "Sem posição"}</p>
            </div>
            <div>
              <strong>Leitura da missão</strong>
              <p>
                {result.distanceKm === null
                  ? "O cronómetro terminou antes da marcação."
                  : `${formatDistanceKm(result.distanceKm)} de diferença entre o teu ponto e o alvo.`}
              </p>
            </div>
          </div>

          {result.media ? (
            <Card variant="tacticalHighlight" className="debrief-source-card">
              <div>
                <span className="muted-eyebrow">Fonte usada nesta ronda</span>
                <strong>{result.media.sourceProvider}</strong>
                <p>
                  {result.media.imageAttribution
                    ? `Atribuição: ${result.media.imageAttribution}`
                    : "Atribuição detalhada não disponível para esta fonte."}
                </p>
              </div>

              <div className="debrief-source-meta">
                {result.media.imageLicense ? <span className="chip chip-soft">{result.media.imageLicense}</span> : null}
                {result.media.verifiedAt ? <span className="chip chip-soft">Verificado em {result.media.verifiedAt}</span> : null}
              </div>

              <div className="debrief-source-links">
                {sourceUrl ? (
                  <a
                    aria-label="Abrir fonte visual numa nova aba"
                    href={sourceUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                    title="Abrir fonte visual numa nova aba"
                  >
                    Abrir fonte
                    <ExternalLink size={13} strokeWidth={2.4} />
                  </a>
                ) : (
                  <span aria-disabled="true" className="debrief-source-link-disabled">
                    Fonte indisponível
                  </span>
                )}
                {licenseUrl ? (
                  <a
                    aria-label="Abrir licença da imagem numa nova aba"
                    href={licenseUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                    title="Abrir licença da imagem numa nova aba"
                  >
                    Ver licença
                    <ExternalLink size={13} strokeWidth={2.4} />
                  </a>
                ) : (
                  <span aria-disabled="true" className="debrief-source-link-disabled">
                    Licença indisponível
                  </span>
                )}
              </div>
            </Card>
          ) : null}

          <div className="debrief-intel-log">
            <div className="debrief-intel-log-head">
              <span className="muted-eyebrow">Pistas da ronda</span>
              <span className="chip chip-soft">{result.clues.length} pistas</span>
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
        </Card>
      </div>

    </section>
  );
}
