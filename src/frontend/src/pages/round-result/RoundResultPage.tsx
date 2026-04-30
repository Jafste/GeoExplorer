import { ExternalLink, MapPinned, MoveRight, Radar, ScanLine, Waypoints } from "lucide-react";
import { EuropeGuessMap } from "../../components/EuropeGuessMap";
import { Card } from "../../components/layout/card/card";
import { InfoGrid } from "../../components/ui/InfoCard";
import { RoundedButton } from "../../components/ui/roundedButton";
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
  const sourceUrl = result.media?.imageSourceUrl?.trim();
  const licenseUrl = result.media?.imageLicenseUrl?.trim().replace(/^http:\/\//, "https://");

  return (
    <section className="screen-shell screen-shell-debrief">
      <div className="section-header">
        <div>
          <div className="eyebrow">resumo da ronda</div>
          <h2 className="section-title">Resultado confirmado.</h2>
        </div>
        <div className="debrief-header-actions">
          <RoundedButton color="neon" tone="ghost" radius="none" onClick={onHome} type="button">
            Terminar sessão
          </RoundedButton>
          <RoundedButton intent="primary" radius="none" disabled={busy} onClick={onContinue} type="button">
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
              <span className="chip chip-soft">Setor europeu</span>
              <span className="chip chip-highlight">{result.resolution === "timeout" ? "Tempo esgotado" : "Marcação confirmada"}</span>
            </div>
          </div>

          <div className="debrief-map-stage">
            <EuropeGuessMap
              allowExploration
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
        </Card>

        <Card as="article" variant="tacticalStack">
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

          <InfoGrid
            layout="preview"
            items={[
              { label: "Precisão", value: `${accuracy.toFixed(1)}%` },
              {
                label: "Desvio",
                value: result.distanceKm === null ? "Sem dados" : `${result.distanceKm.toFixed(1)} km`,
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

          {result.media ? (
            <Card variant="tacticalHighlight" className="debrief-source-card">
              <div>
                <span className="muted-eyebrow">Fonte visual</span>
                <strong>{result.media.sourceProvider}</strong>
                <p>
                  {result.media.imageAttribution
                    ? `Imagem: ${result.media.imageAttribution}`
                    : "Metadata da imagem disponível no dataset."}
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
                    Ver fonte
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
        </Card>
      </div>

    </section>
  );
}
