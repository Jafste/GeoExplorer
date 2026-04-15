import * as React from "react";

type Size = "xs" | "sm" | "md";

const SIZES: Record<Size, string> = {
  xs: "px-3 py-0.5 text-[10px]",
  sm: "px-3 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
};

export type RoundedFileInputProps =
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
    size?: Size;
    fullWidth?: boolean;
  };

export const RoundedFileInput = React.forwardRef<HTMLInputElement, RoundedFileInputProps>(
  (
    {
      size = "sm",
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "block rounded-full border outline-none transition " +
      "focus-visible:ring-2 focus-visible:ring-geoguessr-500 focus-visible:ring-offset-1 " +
      "disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed " +
      "border-slate-200 bg-slate-50 text-slate-700 " +
      "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 " +
      "file:mr-3 file:rounded-full file:border-0 file:px-3 file:py-1 " +
      "file:text-[11px] file:font-medium " +
      "file:bg-geoguessr-600 file:text-white hover:file:bg-geoguessr-700";

    const widthCls = fullWidth ? "w-full" : "";

    const classes = [base, SIZES[size], widthCls, className]
      .filter(Boolean)
      .join(" ");

    return (
      <input
        ref={ref}
        type="file"
        className={classes}
        disabled={disabled}
        {...props}
      />
    );
  }
);

RoundedFileInput.displayName = "RoundedFileInput";