import { useState } from "react";
import { EuropeGuessMap, type MapHotspot } from "../../components/EuropeGuessMap";
import { Card } from "../../components/layout/card/card";
import { InfoGrid } from "../../components/ui/InfoCard";
import { OptionGroup } from "../../components/ui/OptionGroup";
import { RoundedButton } from "../../components/ui/roundedButton";
import type { SessionConfig } from "../../types/game";

interface SetupScreenProps {
  busy: boolean;
  initialConfig: SessionConfig;
  onBack: () => void;
  onOpenTutorial: () => void;
  onSubmit: (config: SessionConfig) => void;
}

export function SetupPage({
  busy,
  initialConfig,
  onBack,
  onOpenTutorial,
  onSubmit,
}: SetupScreenProps) {
  const [config, setConfig] = useState<SessionConfig>(initialConfig);
  const paceLabel = config.timed ? `${config.roundTimeSeconds}s / ronda` : "Sem cronómetro";
  const previewHotspots: MapHotspot[] = [
    { label: "Porto", latitude: 41.1402, longitude: -8.611, tone: "primary", value: "pino exemplo" },
    { label: "Innsbruck", latitude: 47.2692, longitude: 11.4041, tone: "neutral", value: "alpes" },
    { label: "Tallinn", latitude: 59.437, longitude: 24.7536, tone: "neutral", value: "báltico" },
  ];

  return (
    <section className="screen-shell">
      <div className="section-header section-header-inline">
        <div className="setup-header-copy">
          <div className="eyebrow">pré-lançamento</div>
          <h2 className="section-title">Afinar parâmetros antes da primeira ronda.</h2>
        </div>

        <div className="setup-header-actions">
          <RoundedButton color="neon" tone="ghost" size="compact" radius="none" onClick={onOpenTutorial} type="button">
            Rever tutorial
          </RoundedButton>
          <RoundedButton color="neon" tone="subtle" size="compact" radius="none" onClick={onBack} type="button">
            Voltar
          </RoundedButton>
        </div>
      </div>

      <div className="setup-stage">
        <Card as="article" variant="setupPanelStack">
          <OptionGroup
            label="Número de rondas"
            options={[
              { label: "3 rondas", value: 3 },
              { label: "5 rondas", value: 5 },
              { label: "7 rondas", value: 7 },
            ]}
            value={config.roundCount}
            onChange={(roundCount) => setConfig((current) => ({ ...current, roundCount }))}
          />

          <OptionGroup
            label="Modo de tempo"
            options={[
              { label: "Livre", value: false },
              { label: "Cronometrado", value: true },
            ]}
            value={config.timed}
            onChange={(timed) =>
              setConfig((current) => ({
                ...current,
                timed,
                roundTimeSeconds: timed ? current.roundTimeSeconds ?? 60 : null,
              }))
            }
          />

          {config.timed ? (
            <OptionGroup
              label="Tempo por ronda"
              options={[
                { label: "45s", value: 45 },
                { label: "60s", value: 60 },
                { label: "90s", value: 90 },
              ]}
              value={config.roundTimeSeconds ?? 60}
              onChange={(roundTimeSeconds) =>
                setConfig((current) => ({ ...current, roundTimeSeconds }))
              }
            />
          ) : null}

          <InfoGrid
            items={[
              { label: "Região", value: "Europa" },
              { label: "Ritmo", value: paceLabel },
              { label: "Modo", value: "Solo clássico" },
            ]}
          />

          <div className="action-row action-row-spread">
            <RoundedButton color="neon" tone="ghost" radius="none" onClick={onBack} type="button">
              Cancelar
            </RoundedButton>

            <RoundedButton
              className="setup-submit"
              disabled={busy}
              intent="primary"
              onClick={() => onSubmit(config)}
              radius="none"
              type="button"
            >
              {busy ? "A iniciar..." : "Lançar missão"}
            </RoundedButton>
          </div>
        </Card>

        <Card as="article" variant="setupPanel">
          <div className="setup-preview-top">
            <span className="muted-eyebrow">Pré-visualização</span>
            <span className="setup-preview-badge">{config.roundCount} rondas</span>
          </div>

          <div className="setup-preview-window">
            <EuropeGuessMap
              disabled
              guess={null}
              hotspots={previewHotspots}
              showFooter={false}
            />

            <Card variant="previewOverlay">
              <span className="muted-eyebrow">Como vai funcionar</span>
              <strong>{paceLabel}</strong>
              <p>Observa a imagem, marca no mapa real e compara distância e pontuação.</p>
            </Card>
          </div>

          <InfoGrid
            layout="preview"
            items={[
              { label: "Fluxo", value: "Observar → Marcar → Comparar" },
              { label: "Mapa", value: "OpenStreetMap como base visual" },
              { label: "Âmbito", value: "Europa, imagens reais e cronómetro opcional.", span: "full" },
            ]}
          />
        </Card>
      </div>
    </section>
  );
}
