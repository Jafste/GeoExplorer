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
  const paceLabel = config.timed ? `${config.roundTimeSeconds}s / round` : "No timer";

  return (
    <section className="screen-shell">
      <div className="section-header section-header-inline">
        <div className="setup-header-copy">
          <div className="eyebrow">ready the match</div>
          <h2 className="section-title">Tune the session before the first round.</h2>
        </div>

        <div className="setup-header-actions">
          <button className="button button-ghost button-compact" onClick={onOpenTutorial} type="button">
            Replay tutorial
          </button>
          <button className="button button-subtle button-compact" onClick={onBack} type="button">
            Back
          </button>
        </div>
      </div>

      <div className="setup-stage">
        <article className="setup-panel setup-panel-main">
          <div className="setup-field">
            <p className="field-label">Round count</p>
            <div className="toggle-row">
              {[3, 5, 7].map((value) => (
                <button
                  className={`chip ${config.roundCount === value ? "chip-highlight" : "chip-soft"}`}
                  key={value}
                  onClick={() => setConfig((current) => ({ ...current, roundCount: value }))}
                  type="button"
                >
                  {value} rounds
                </button>
              ))}
            </div>
          </div>

          <div className="setup-field">
            <p className="field-label">Timer mode</p>
            <div className="toggle-row">
              <button
                className={`chip ${!config.timed ? "chip-highlight" : "chip-soft"}`}
                onClick={() =>
                  setConfig((current) => ({ ...current, timed: false, roundTimeSeconds: null }))
                }
                type="button"
              >
                Untimed
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
                Timed
              </button>
            </div>
          </div>

          {config.timed ? (
            <div className="setup-field">
              <p className="field-label">Time per round</p>
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
              <span className="muted-eyebrow">Region</span>
              <strong>Europe</strong>
            </div>

            <div className="setup-stat">
              <span className="muted-eyebrow">Pace</span>
              <strong>{paceLabel}</strong>
            </div>

            <div className="setup-stat">
              <span className="muted-eyebrow">Mode</span>
              <strong>Classic solo</strong>
            </div>
          </div>

          <div className="action-row action-row-spread">
            <button className="button button-ghost" onClick={onBack} type="button">
              Return
            </button>

            <button
              className="button button-primary setup-submit"
              disabled={busy}
              onClick={() => onSubmit(config)}
              type="button"
            >
              {busy ? "Starting..." : "Launch match"}
            </button>
          </div>
        </article>

        <article className="setup-panel setup-panel-preview">
          <div className="setup-preview-top">
            <span className="muted-eyebrow">Session preview</span>
            <span className="setup-preview-badge">{config.roundCount} rounds</span>
          </div>

          <div className="setup-preview-window">
            <div className="setup-preview-score">
              <span className="muted-eyebrow">Opening HUD</span>
              <strong>0 pts</strong>
            </div>

            <div className="setup-preview-route" />
            <div className="setup-preview-route setup-preview-route-alt" />
            <div className="setup-preview-point setup-preview-point-a" />
            <div className="setup-preview-point setup-preview-point-b" />
            <div className="setup-preview-point setup-preview-point-c" />

            <div className="setup-preview-card">
              <span className="muted-eyebrow">Selected pace</span>
              <strong>{paceLabel}</strong>
              <p>Short prep. Clean map. Fast rounds.</p>
            </div>
          </div>

          <div className="setup-preview-grid">
            <div className="setup-preview-cell">
              <span className="muted-eyebrow">Flow</span>
              <strong>Setup → Guess → Score</strong>
            </div>

            <div className="setup-preview-cell">
              <span className="muted-eyebrow">Tutorial</span>
              <strong>Replay anytime</strong>
            </div>

            <div className="setup-preview-cell setup-preview-cell-wide">
              <span className="muted-eyebrow">Scope</span>
              <strong>Europe, solo, timer optional.</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
