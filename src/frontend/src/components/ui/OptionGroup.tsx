import { SegmentedControl } from "./SegmentedControl";

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
    <SegmentedControl
      label={label}
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}
