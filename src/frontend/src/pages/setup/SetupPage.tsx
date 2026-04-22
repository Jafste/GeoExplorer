import { useState } from "react";
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

  return (
    <section className="screen-shell">
      <div className="section-header section-header-inline">
        <div className="setup-header-copy">
          <div className="eyebrow">pré-lançamento</div>
          <h2 className="section-title">Afinar parâmetros antes da primeira ronda.</h2>
        </div>

        <div className="setup-header-actions">
          <button className="button button-ghost button-compact" onClick={onOpenTutorial} type="button">
            Rever tutorial
          </button>
          <button className="button button-subtle button-compact" onClick={onBack} type="button">
            Regressar
          </button>
        </div>
      </div>

      <div className="setup-stage">
        <article className="setup-panel setup-panel-main">
          <div className="setup-field">
            <p className="field-label">Número de rondas</p>
            <div className="toggle-row">
              {[3, 5, 7].map((value) => (
                <button
                  className={`chip ${config.roundCount === value ? "chip-highlight" : "chip-soft"}`}
                  key={value}
                  onClick={() => setConfig((current) => ({ ...current, roundCount: value }))}
                  type="button"
                >
                  {value} rondas
                </button>
              ))}
            </div>
          </div>

          <div className="setup-field">
            <p className="field-label">Modo de tempo</p>
            <div className="toggle-row">
              <button
                className={`chip ${!config.timed ? "chip-highlight" : "chip-soft"}`}
                onClick={() =>
                  setConfig((current) => ({ ...current, timed: false, roundTimeSeconds: null }))
                }
                type="button"
              >
                Livre
              </button>
              <button
                className={`chip ${config.timed ? "chip-highlight" : "chip-soft"}`}
                onClick={() =>
                  setConfig((current) => ({
                    ...current,
                    timed: true,
                    roundTimeSeconds: current.roundTimeSeconds ?? 60,
                  }))
                }
                type="button"
              >
                Cronometrado
              </button>
            </div>
          </div>

          {config.timed ? (
            <div className="setup-field">
              <p className="field-label">Tempo por ronda</p>
              <div className="toggle-row">
                {[45, 60, 90].map((value) => (
                  <button
                    className={`chip ${config.roundTimeSeconds === value ? "chip-highlight" : "chip-soft"}`}
                    key={value}
                    onClick={() =>
                      setConfig((current) => ({ ...current, roundTimeSeconds: value }))
                    }
                    type="button"
                  >
                    {value}s
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="setup-meta-row">
            <div className="setup-stat">
              <span className="muted-eyebrow">Região</span>
              <strong>Europa</strong>
            </div>

            <div className="setup-stat">
              <span className="muted-eyebrow">Ritmo</span>
              <strong>{paceLabel}</strong>
            </div>

            <div className="setup-stat">
              <span className="muted-eyebrow">Modo</span>
              <strong>Solo clássico</strong>
            </div>
          </div>

          <div className="action-row action-row-spread">
            <button className="button button-ghost" onClick={onBack} type="button">
              Cancelar
            </button>

            <button
              className="button button-primary setup-submit"
              disabled={busy}
              onClick={() => onSubmit(config)}
              type="button"
            >
              {busy ? "A iniciar..." : "Lançar missão"}
            </button>
          </div>
        </article>

        <article className="setup-panel setup-panel-preview">
          <div className="setup-preview-top">
            <span className="muted-eyebrow">Pré-visualização</span>
            <span className="setup-preview-badge">{config.roundCount} rondas</span>
          </div>

          <div className="setup-preview-window">
            <div className="setup-preview-score">
              <span className="muted-eyebrow">HUD inicial</span>
              <strong>0 pts</strong>
            </div>

            <div className="setup-preview-route" />
            <div className="setup-preview-route setup-preview-route-alt" />
            <div className="setup-preview-point setup-preview-point-a" />
            <div className="setup-preview-point setup-preview-point-b" />
            <div className="setup-preview-point setup-preview-point-c" />

            <div className="setup-preview-card">
              <span className="muted-eyebrow">Ritmo selecionado</span>
              <strong>{paceLabel}</strong>
              <p>Preparação curta, leitura clara, decisão rápida.</p>
            </div>
          </div>

          <div className="setup-preview-grid">
            <div className="setup-preview-cell">
              <span className="muted-eyebrow">Fluxo</span>
              <strong>Preparar → Marcar → Pontuar</strong>
            </div>

            <div className="setup-preview-cell">
              <span className="muted-eyebrow">Tutorial</span>
              <strong>Disponível a qualquer momento</strong>
            </div>

            <div className="setup-preview-cell setup-preview-cell-wide">
              <span className="muted-eyebrow">Âmbito</span>
              <strong>Europa, solo, com cronómetro opcional.</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
