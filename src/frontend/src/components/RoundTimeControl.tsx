import { useEffect, useState } from "react";
import { NumberField } from "./ui/TextField";
import { SegmentedControl } from "./ui/SegmentedControl";

export const DEFAULT_ROUND_TIME_SECONDS = 60;
export const MIN_ROUND_TIME_SECONDS = 1;
export const MAX_ROUND_TIME_SECONDS = 3600;
export const QUICK_ROUND_TIME_SECONDS = [20, 30, 60] as const;

type RoundTimeControlProps = {
  value: number | null;
  onChange: (seconds: number) => void;
};

export function normalizeRoundTimeSeconds(
  value: string | number | null | undefined,
  fallback = DEFAULT_ROUND_TIME_SECONDS
) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(MAX_ROUND_TIME_SECONDS, Math.max(MIN_ROUND_TIME_SECONDS, Math.round(parsed)));
}

export function RoundTimeControl({ value, onChange }: RoundTimeControlProps) {
  const selectedSeconds = value ?? DEFAULT_ROUND_TIME_SECONDS;
  const [draftSeconds, setDraftSeconds] = useState(String(selectedSeconds));

  useEffect(() => {
    setDraftSeconds(String(selectedSeconds));
  }, [selectedSeconds]);

  const commitDraft = () => {
    const normalizedSeconds = normalizeRoundTimeSeconds(draftSeconds, selectedSeconds);

    setDraftSeconds(String(normalizedSeconds));
    onChange(normalizedSeconds);
  };

  return (
    <div className="round-time-control">
      <SegmentedControl
        label="Tempo por ronda"
        options={QUICK_ROUND_TIME_SECONDS.map((seconds) => ({
          label: `${seconds}s`,
          value: seconds,
        }))}
        value={selectedSeconds}
        onChange={(seconds) => {
          setDraftSeconds(String(seconds));
          onChange(seconds);
        }}
      />

      <NumberField
        aria-label="Tempo por ronda personalizado em segundos"
        autoComplete="off"
        className="round-time-custom"
        inputWrapperClassName="round-time-input-shell"
        label="Personalizado"
        labelClassName="field-label"
        max={MAX_ROUND_TIME_SECONDS}
        min={MIN_ROUND_TIME_SECONDS}
        name="roundTimeSeconds"
        onBlur={commitDraft}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraftSeconds(nextDraft);

          if (nextDraft !== "") {
            const nextSeconds = Number(nextDraft);

            if (
              Number.isFinite(nextSeconds) &&
              nextSeconds >= MIN_ROUND_TIME_SECONDS &&
              nextSeconds <= MAX_ROUND_TIME_SECONDS
            ) {
              onChange(Math.round(nextSeconds));
            }
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        step={1}
        trailing={<span>seg</span>}
        value={draftSeconds}
      />
    </div>
  );
}
