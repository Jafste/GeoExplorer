import { CountryScopeSelect } from "./CountryScopeSelect";
import { RoundTimeControl } from "./RoundTimeControl";
import { SegmentedControl } from "./ui/SegmentedControl";
import type { SessionConfig } from "../types/game";

interface SessionConfigControlsProps {
  config: SessionConfig;
  onChange: (config: SessionConfig) => void;
  showTotalScoreDuringRound?: boolean;
  onShowTotalScoreDuringRoundChange?: (showTotalScoreDuringRound: boolean) => void;
}

export function SessionConfigControls({
  config,
  onChange,
  showTotalScoreDuringRound,
  onShowTotalScoreDuringRoundChange,
}: SessionConfigControlsProps) {
  return (
    <>
      <CountryScopeSelect
        value={config.countries ?? (config.country ? [config.country] : [])}
        onChange={(countries) => onChange({ ...config, country: null, countries })}
      />

      <SegmentedControl
        label="Número de rondas"
        options={[
          { label: "3 rondas", value: 3 },
          { label: "5 rondas", value: 5 },
          { label: "7 rondas", value: 7 },
        ]}
        value={config.roundCount}
        onChange={(roundCount) => onChange({ ...config, roundCount })}
      />

      <SegmentedControl
        label="Modo de tempo"
        options={[
          { label: "Livre", value: false },
          { label: "Cronometrado", value: true },
        ]}
        value={config.timed}
        onChange={(timed) =>
          onChange({
            ...config,
            timed,
            roundTimeSeconds: timed ? config.roundTimeSeconds ?? 60 : null,
          })
        }
      />

      {config.timed ? (
        <RoundTimeControl
          value={config.roundTimeSeconds}
          onChange={(roundTimeSeconds) => onChange({ ...config, roundTimeSeconds })}
        />
      ) : null}

      {onShowTotalScoreDuringRoundChange ? (
        <label className="setup-switch-row">
          <span>
            <strong>Mostrar pontuação total</strong>
            <small>Durante e depois da ronda</small>
          </span>
          <input
            checked={showTotalScoreDuringRound ?? false}
            name="showTotalScoreDuringRound"
            onChange={(event) => onShowTotalScoreDuringRoundChange(event.currentTarget.checked)}
            type="checkbox"
          />
        </label>
      ) : null}
    </>
  );
}
