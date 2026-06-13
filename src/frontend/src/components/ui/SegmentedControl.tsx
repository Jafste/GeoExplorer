import type { ReactNode } from "react";
import { ButtonBase } from "./Button";

type SegmentValue = string | number | boolean;

export type SegmentedControlOption<TValue extends SegmentValue> = {
  disabled?: boolean;
  label: ReactNode;
  value: TValue;
};

export type SegmentedControlProps<TValue extends SegmentValue> = {
  className?: string;
  disabled?: boolean;
  label?: ReactNode;
  labelClassName?: string;
  options: SegmentedControlOption<TValue>[];
  optionClassName?: string;
  value: TValue;
  onChange: (value: TValue) => void;
};

export function SegmentedControl<TValue extends SegmentValue>({
  className,
  disabled = false,
  label,
  labelClassName,
  options,
  optionClassName,
  value,
  onChange,
}: SegmentedControlProps<TValue>) {
  return (
    <div className={["setup-field", className].filter(Boolean).join(" ")}>
      {label ? <p className={["field-label", labelClassName].filter(Boolean).join(" ")}>{label}</p> : null}
      <div className="toggle-row">
        {options.map((option) => {
          const active = option.value === value;
          const optionDisabled = disabled || option.disabled;

          return (
            <ButtonBase
              aria-pressed={active}
              className={[
                "chip",
                active ? "chip-highlight" : "chip-soft",
                optionClassName,
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={optionDisabled}
              key={String(option.value)}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </ButtonBase>
          );
        })}
      </div>
    </div>
  );
}
