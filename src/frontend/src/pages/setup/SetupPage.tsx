import { useState } from "react";
import { EuropeGuessMap, type MapHotspot } from "../../components/EuropeGuessMap";
import { Card } from "../../components/layout/card/card";
import { SessionConfigControls } from "../../components/SessionConfigControls";
import { RoundedButton } from "../../components/ui/roundedButton";
import type { SessionConfig } from "../../types/game";

interface SetupScreenProps {
  busy: boolean;
  initialConfig: SessionConfig;
  showTotalScoreDuringRound: boolean;
  onShowTotalScoreDuringRoundChange: (showTotalScoreDuringRound: boolean) => void;
  onSubmit: (config: SessionConfig) => void;
}

export function SetupPage({
  busy,
  initialConfig,
  showTotalScoreDuringRound,
  onShowTotalScoreDuringRoundChange,
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
          <SessionConfigControls
            config={config}
            onChange={setConfig}
            onShowTotalScoreDuringRoundChange={onShowTotalScoreDuringRoundChange}
            showTotalScoreDuringRound={showTotalScoreDuringRound}
          />

          <div className="action-row action-row-end">
            <RoundedButton
              className="setup-submit"
              disabled={busy}
              intent="primary"
              onClick={() => onSubmit(config)}
              radius="none"
              type="button"
            >
              {busy ? "A iniciar…" : "Começar missão"}
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
