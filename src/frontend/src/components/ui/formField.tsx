import React from "react";

type FormFieldProps = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  srOnlyLabel?: boolean;
  className?: string;
  children: (args: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
};

export function FormField({
  label,
  hint,
  error,
  required,
  srOnlyLabel,
  className,
  children,
}: FormFieldProps) {
  const reactId = React.useId();
  const id = `field-${reactId}`;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const invalid = !!error;

  return (
    <div className={["space-y-1", className].filter(Boolean).join(" ")}>
      {label ? (
        <label
          htmlFor={id}
          className={[
            "text-[11px] font-medium text-slate-700 dark:text-slate-200",
            srOnlyLabel ? "sr-only" : "",
          ].join(" ")}
        >
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </label>
      ) : null}

      {children({ id, describedBy, invalid })}

      {error ? (
        <div id={errorId} className="text-[11px] text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : hint ? (
        <div id={hintId} className="text-[11px] text-slate-500 dark:text-slate-400">
          {hint}
        </div>
      ) : null}
    </div>
  );
}