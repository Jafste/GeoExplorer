import * as React from "react";
import { useCallback, useId, useState } from "react";

type SwitchColor = "slate" | "emerald" | "geoguessr" | "rose";
type Intent = "neutral" | "primary" | "success" | "danger";
type Size = "xs" | "sm" | "md";

const INTENT_TO_COLOR: Record<Intent, SwitchColor> = {
  neutral: "slate",
  primary: "geoguessr",
  success: "emerald",
  danger: "rose",
};
const TRACK_BG_ON: Record<SwitchColor, string> = {
  slate: "bg-slate-600 dark:bg-slate-500",
  emerald: "bg-emerald-600 dark:bg-emerald-500",
  geoguessr: "bg-geoguessr-600 dark:bg-geoguessr-500",
  rose: "bg-rose-600 dark:bg-rose-500",
};

const TRACK_BG_OFF = "bg-slate-300 dark:bg-slate-700";

const DISCOUNT_COLOR: Record<SwitchColor, string> = {
  slate: "text-slate-600 dark:text-slate-300",
  emerald: "text-emerald-600 dark:text-emerald-400",
  geoguessr: "text-geoguessr-600 dark:text-geoguessr-400",
  rose: "text-rose-600 dark:text-rose-400",
};

const SIZES: Record<
  Size,
  {
    track: string;
    thumb: string;
    thumbTranslateChecked: string;
    gap: string;
    labelText: string;
  }
> = {
  xs: {
    track: "w-9 h-5",
    thumb: "w-4 h-4 top-0.5 left-0.5",
    thumbTranslateChecked: "translate-x-4", // 16px travel
    gap: "gap-2",
    labelText: "text-[11px]",
  },
  sm: {
    track: "w-10 h-5",
    thumb: "w-4 h-4 top-0.5 left-0.5",
    thumbTranslateChecked: "translate-x-5", // 20px travel
    gap: "gap-3",
    labelText: "text-xs",
  },
  md: {
    track: "w-[44px] h-6",
    thumb: "w-5 h-5 top-0.5 left-0.5",
    thumbTranslateChecked: "translate-x-5", // 20px travel
    gap: "gap-3",
    labelText: "text-sm",
  },
};

function useControllableBoolean(opts: {
  value?: boolean;
  defaultValue?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const { value, defaultValue, onChange } = opts;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<boolean>(defaultValue ?? false);
  const current = isControlled ? (value as boolean) : internal;

  const set = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  return [current, set] as const;
}

export type RoundedSwitchProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size" | "checked" | "defaultChecked" | "onChange"
> & {
  readOnly?: boolean;

  label?: React.ReactNode;
  hideLabelRow?: boolean; // if true, don't render the top label bar
  labelClassName?: string;

  intent?: Intent;
  color?: SwitchColor;
  size?: Size;

  leftLabel?: React.ReactNode;
  rightLabel?: React.ReactNode;
  rightHint?: React.ReactNode;
  labelWidthClass?: string;

  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;

  // Layout helpers
  containerClassName?: string;
  labelsClassName?: string;

  // extra classes for the visual track button */
  trackClassName?: string;

  //for changing the text font size, font, things like that
  labelTextClassName?: string;
};

export const RoundedSwitch = React.forwardRef<HTMLInputElement, RoundedSwitchProps>(
  (
    {
      readOnly,
      label,
      hideLabelRow,
      labelClassName,

      intent = "neutral",
      color,
      size = "md",

      leftLabel = "Monthly",
      rightLabel = "Annually",
      rightHint,
      labelWidthClass = "min-w-[120px]",

      checked,
      defaultChecked,
      onCheckedChange,

      disabled,
      id,
      className,
      containerClassName,
      labelsClassName,
      trackClassName,

      name,
      required,
      value,

      labelTextClassName,

      ...restInputProps
    },
    ref
  ) => {

    const labelTextClass =
      labelTextClassName ??
      "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400";
    const autoId = useId();
    const inputId = id ?? `rounded-switch-${autoId}`;

    const resolvedColor: SwitchColor = color ?? INTENT_TO_COLOR[intent];
    const sz = SIZES[size];

    const [isOn, setIsOn] = useControllableBoolean({
      value: checked,
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
    });
    const isLocked = !!disabled || !!readOnly;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isLocked) {
        e.preventDefault();
        return;
      }
      setIsOn(e.target.checked);
    };

    const toggle = () => {
      if (isLocked) return;
      setIsOn(!isOn);
    };

    const trackBg = isOn ? TRACK_BG_ON[resolvedColor] : TRACK_BG_OFF;

    return (
      <div className={["flex flex-col gap-1", containerClassName].filter(Boolean).join(" ")}>
        {/* Top label row (match SingleSelectFilter) */}
        {/* Top label row height (keep alignment with selects) */}
        <div
          className={[
            "mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em]",
            hideLabelRow
              ? "text-transparent select-none" // keeps height, hides text
              : "text-slate-500 dark:text-slate-400",
            labelClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span>{hideLabelRow ? "." : label ?? ""}</span>
        </div>

    {/* Your existing horizontal switch row */}
    <div className={["flex items-center", sz.gap, labelsClassName].filter(Boolean).join(" ")}>
      {/* Left label */}
      {leftLabel != null && (
            <div
              className={[
                labelTextClass,
                "text-right",
                labelWidthClass,
              ].join(" ")}
            >
              {leftLabel}
        </div>
      )}

      {/* Input */}
      <input
        ref={ref}
        id={inputId}
        name={name}
        required={required}
        value={value}
        type="checkbox"
        className={["sr-only", className].filter(Boolean).join(" ")}
        checked={isOn}
        onChange={handleInputChange}
        aria-readonly={readOnly || undefined}
        disabled={disabled}
        {...restInputProps}
      />

      {/* Button */}
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-controls={inputId}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        className={[
          "relative inline-flex shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2",
          trackBg,
          sz.track,
          (disabled || isLocked) ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          trackClassName,
        ].filter(Boolean).join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "absolute block rounded-full bg-white shadow-sm",
            "transition-transform duration-150 ease-out transform",
            sz.thumb,
            isOn ? sz.thumbTranslateChecked : "translate-x-0",
          ].join(" ")}
        />
        <span className="sr-only">Toggle</span>
      </button>

      {/* Right label */}
          {rightLabel != null && (
            <div
              className={[
                labelTextClass,
                labelWidthClass,
              ].join(" ")}
        >
          <span>{rightLabel}</span>
          {rightHint ? (
            <span className={["ml-2", DISCOUNT_COLOR[resolvedColor]].join(" ")}>
              {rightHint}
            </span>
          ) : null}
        </div>
      )}
    </div>
  </div>
    );
  }
);

RoundedSwitch.displayName = "RoundedSwitch";