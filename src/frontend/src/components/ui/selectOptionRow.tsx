import * as React from "react";

type Mode = "multi" | "single";

export type SelectOptionRowProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    mode: Mode;
    label: string;
    selected: boolean;
    showCheckbox?: boolean;
  };

export const SelectOptionRow = React.forwardRef<
  HTMLButtonElement,
  SelectOptionRowProps
>(
  (
    {
      mode,
      label,
      selected,
      showCheckbox,
      className,
      type = "button",
      title,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "flex w-full items-start px-3 py-1.5 text-left text-[11px] transition";

    const hoverCls = disabled
      ? ""
      : "hover:bg-slate-50 dark:hover:bg-slate-800";

    const disabledCls = disabled
      ? "cursor-not-allowed opacity-50"
      : "";

    const singleLayout = "justify-between";
    const multiLayout = "justify-start gap-2";

    const selectedCls =
      mode === "single" && selected
        ? "bg-slate-50 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100"
        : "text-slate-700 dark:text-slate-200";

    const classes = [
      base,
      hoverCls,
      disabledCls,
      mode === "single" ? singleLayout : multiLayout,
      selectedCls,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const checkboxBase =
      "flex h-3.5 w-3.5 items-center justify-center rounded border text-[9px]";

    const checkboxChecked =
      "border-geoguessr-500 bg-geoguessr-500 text-white";

    const checkboxUnchecked =
      "border-slate-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-900";

    const shouldShowCheckbox =
      mode === "multi" ? showCheckbox ?? true : false;

    const resolvedTitle = title ?? label;

    return (
      <button
        ref={ref}
        type={type}
        title={resolvedTitle}
        className={classes}
        disabled={disabled}
        {...props}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {shouldShowCheckbox && (
            <span
              className={[
                checkboxBase,
                "mt-0.5 shrink-0",
                selected ? checkboxChecked : checkboxUnchecked,
              ].join(" ")}
            >
              ✓
            </span>
          )}
          <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
            {label}
          </span>
        </div>

        {mode === "single" && selected && (
          <span className="ml-2 mt-0.5 shrink-0 text-[10px] text-geoguessr-500">✓</span>
        )}
      </button>
    );
  }
);

SelectOptionRow.displayName = "SelectOptionRow";
