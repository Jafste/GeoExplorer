import { useState } from "react";
import { EuropeGuessMap, type MapHotspot } from "../../components/EuropeGuessMap";
import { Card } from "../../components/layout/card/card";
import { RoundTimeControl } from "../../components/RoundTimeControl";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { RoundedButton } from "../../components/ui/roundedButton";
import type { SessionConfig } from "../../types/game";

interface SetupScreenProps {
  busy: boolean;
  initialConfig: SessionConfig;
  onSubmit: (config: SessionConfig) => void;
}

export function SetupPage({
  busy,
  initialConfig,
  onSubmit,
}: SetupScreenProps) {
  const [config, setConfig] = useState<SessionConfig>(initialConfig);
  const previewHotspots: MapHotspot[] = [
    { label: "Porto", latitude: 41.1402, longitude: -8.611, tone: "primary", value: "pino exemplo" },
    { label: "Innsbruck", latitude: 47.2692, longitude: 11.4041, tone: "neutral", value: "alpes" },
    { label: "Tallinn", latitude: 59.437, longitude: 24.7536, tone: "neutral", value: "báltico" },
  ];

  return (
    <section className="screen-shell">
      <div className="section-header setup-section-header">
        <div className="setup-header-copy">
          <h2 className="section-title">Prepara a missão.</h2>
          <p className="section-support">
            Define quantos alvos vais localizar e o ritmo de cada ronda.
          </p>
        </div>
      </div>

      <div className="setup-stage">
        <Card as="article" className="setup-config-card" variant="setupPanelStack">
          <SegmentedControl
            label="Número de rondas"
            options={[
              { label: "3 rondas", value: 3 },
              { label: "5 rondas", value: 5 },
              { label: "7 rondas", value: 7 },
            ]}
            value={config.roundCount}
            onChange={(roundCount) => setConfig((current) => ({ ...current, roundCount }))}
          />

          <SegmentedControl
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
            <RoundTimeControl
              value={config.roundTimeSeconds}
              onChange={(roundTimeSeconds) =>
                setConfig((current) => ({ ...current, roundTimeSeconds }))
              }
            />
          ) : null}

          <div className="action-row action-row-end">
            <RoundedButton
              className="setup-submit"
              disabled={busy}
              intent="primary"
              onClick={() => onSubmit(config)}
              radius="none"
              type="button"
            >
              {busy ? "A iniciar..." : "Começar missão"}
            </RoundedButton>
          </div>
        </Card>

        <Card as="article" variant="setupPanel">
          <div className="setup-preview-top">
            <span className="muted-eyebrow">Mapa de resposta</span>
          </div>

          <div className="setup-preview-window">
            <EuropeGuessMap
              disabled
              guess={null}
              hotspots={previewHotspots}
              showFooter={false}
            />

          </div>
        </Card>
      </div>
    </section>
  );
}
