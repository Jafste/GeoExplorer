import * as React from "react";

type TextFieldOwnProps = {
  className?: string;
  error?: string;
  hint?: string;
  inputClassName?: string;
  inputWrapperClassName?: string;
  label: React.ReactNode;
  labelClassName?: string;
  leading?: React.ReactNode;
  srOnlyLabel?: boolean;
  trailing?: React.ReactNode;
};

export type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> &
  TextFieldOwnProps;

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      error,
      hint,
      id,
      inputClassName,
      inputWrapperClassName,
      label,
      labelClassName,
      leading,
      required,
      srOnlyLabel = false,
      trailing,
      type = "text",
      ...inputProps
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? `text-field-${generatedId}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [errorId, hintId, inputProps["aria-describedby"]]
      .filter(Boolean)
      .join(" ") || undefined;
    const input = (
      <input
        ref={ref}
        aria-describedby={describedBy}
        aria-invalid={error ? true : inputProps["aria-invalid"]}
        className={inputClassName}
        id={inputId}
        required={required}
        type={type}
        {...inputProps}
      />
    );

    return (
      <label className={className} htmlFor={inputId}>
        <span className={[srOnlyLabel ? "sr-only" : "", labelClassName].filter(Boolean).join(" ")}>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </span>

        {inputWrapperClassName || leading || trailing ? (
          <span className={inputWrapperClassName}>
            {leading}
            {input}
            {trailing}
          </span>
        ) : (
          input
        )}

        {error ? (
          <span id={errorId} className="field-error">
            {error}
          </span>
        ) : hint ? (
          <span id={hintId} className="field-hint">
            {hint}
          </span>
        ) : null}
      </label>
    );
  }
);

TextField.displayName = "TextField";

export type NumberFieldProps = Omit<TextFieldProps, "type" | "inputMode">;

export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>((props, ref) => (
  <TextField ref={ref} inputMode="numeric" type="number" {...props} />
));

NumberField.displayName = "NumberField";
