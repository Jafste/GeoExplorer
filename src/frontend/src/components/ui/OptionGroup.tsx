type OptionValue = string | number | boolean;

export type OptionGroupOption<TValue extends OptionValue> = {
  label: string;
  value: TValue;
};

export type OptionGroupProps<TValue extends OptionValue> = {
  label: string;
  options: OptionGroupOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
};

export function OptionGroup<TValue extends OptionValue>({
  label,
  options,
  value,
  onChange,
}: OptionGroupProps<TValue>) {
  return (
    <div className="setup-field">
      <p className="field-label">{label}</p>
      <div className="toggle-row">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              className={`chip ${active ? "chip-highlight" : "chip-soft"}`}
              key={String(option.value)}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
