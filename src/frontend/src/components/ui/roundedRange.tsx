import * as React from "react";

export type RoundedRangeProps =
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
    fullWidth?: boolean;
  };

export const RoundedRange = React.forwardRef<HTMLInputElement, RoundedRangeProps>(
  ({ className, fullWidth = true, ...props }, ref) => {
    const base =
      "h-2 appearance-none rounded-full outline-none transition " +
      "bg-slate-200 dark:bg-slate-700 " +
      "focus-visible:ring-2 focus-visible:ring-geoguessr-500 focus-visible:ring-offset-1 " +
      "disabled:opacity-60 disabled:pointer-events-none";

    const thumb =
      "[&::-webkit-slider-thumb]:appearance-none " +
      "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 " +
      "[&::-webkit-slider-thumb]:rounded-full " +
      "[&::-webkit-slider-thumb]:bg-geoguessr-600 " +
      "[&::-webkit-slider-thumb]:shadow-sm " +
      "dark:[&::-webkit-slider-thumb]:bg-geoguessr-500 " +
      "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 " +
      "[&::-moz-range-thumb]:rounded-full " +
      "[&::-moz-range-thumb]:bg-geoguessr-600 " +
      "dark:[&::-moz-range-thumb]:bg-geoguessr-500";

    const widthCls = fullWidth ? "w-full" : "";

    return (
      <input
        ref={ref}
        type="range"
        className={[base, thumb, widthCls, className].filter(Boolean).join(" ")}
        {...props}
      />
    );
  }
);

RoundedRange.displayName = "RoundedRange";