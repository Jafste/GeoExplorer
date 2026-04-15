import * as React from "react";

type ButtonColor = "slate" | "emerald" | "geoguessr" | "rose";
type ButtonTone = "soft" | "solid" | "outline" | "ghost";
type Intent = "neutral" | "primary" | "success" | "danger";
type Size = "xs" | "sm" | "md";

const COLOR_TONES: Record<ButtonColor, Record<ButtonTone, string>> = {
  slate: {
    soft:
      "border border-slate-300 bg-white text-slate-700 shadow-sm " +
      "hover:border-slate-400 hover:bg-slate-50 " +
      "dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 " +
      "dark:hover:border-slate-500 dark:hover:bg-slate-700",
    solid:
      "border border-slate-700 bg-slate-800 text-white shadow-sm " +
      "hover:bg-slate-900 hover:border-slate-900",
    outline:
      "border border-slate-300 bg-transparent text-slate-700 " +
      "hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800",
    ghost:
      "border border-transparent bg-transparent text-slate-700 " +
      "hover:bg-slate-100 dark:hover:text-slate-100 " +
      "dark:text-slate-100 dark:hover:bg-slate-800",
  },

  emerald: {
    soft:
      "border border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm " +
      "hover:bg-emerald-600 hover:border-emerald-600 hover:text-white",
    solid:
      "border border-emerald-600 bg-emerald-600 text-white shadow-sm " +
      "hover:bg-emerald-700 hover:border-emerald-700",
    outline:
      "border border-emerald-500 bg-transparent text-emerald-700 hover:bg-emerald-50",
    ghost:
      "border border-transparent bg-transparent text-slate-700 dark:text-slate-200 " +
      "hover:bg-emerald-50 hover:text-emerald-800 " +
      "dark:hover:bg-emerald-950 dark:hover:text-emerald-400",
  },

  geoguessr: {
    soft:
      "border border-geoguessr-500 bg-geoguessr-50 text-geoguessr-700 shadow-sm " +
      "hover:bg-geoguessr-600 hover:border-geoguessr-600 hover:text-white",
    solid:
      "border border-geoguessr-600 bg-geoguessr-600 text-white shadow-sm " +
      "hover:bg-geoguessr-700 hover:border-geoguessr-700",
    outline:
      "border border-geoguessr-500 bg-transparent text-geoguessr-700 hover:bg-geoguessr-50",
    ghost:
      "border border-transparent bg-transparent text-slate-700 " +
      "hover:bg-geoguessr-100 hover:text-geoguessr-500 dark:hover:bg-geoguessr-900 dark:hover:text-geoguessr-400",
  },

  rose: {
    soft:
      "border border-rose-500 bg-rose-50 text-rose-700 shadow-sm " +
      "hover:bg-rose-600 hover:border-rose-600 hover:text-white",
    solid:
      "border border-rose-600 bg-rose-600 text-white shadow-sm " +
      "hover:bg-rose-700 hover:border-rose-700",
    outline:
      "border border-rose-500 bg-transparent text-rose-700 hover:bg-rose-50",
    ghost:
      "border border-transparent bg-transparent text-slate-700 " +
      "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400",
  },
};

const INTENT_TO_COLOR: Record<Intent, ButtonColor> = {
  neutral: "slate",
  primary: "geoguessr",
  success: "emerald",
  danger: "rose",
};

const SIZES: Record<Size, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
};
type Kind = "button" | "chip";

const CHIP_BASE =
  "rounded-full font-semibold uppercase tracking-[0.16em]";

const CHIP_SIZES: Record<Size, string> = {
  xs: "px-2 py-[3px] text-[10px]",
  sm: "px-2.5 py-[3px] text-[10px]",
  md: "px-3 py-1 text-[11px]",
};

const CHIP_STATE: Record<"active" | "inactive", string> = {
  active: "bg-geoguessr-600 text-white hover:bg-geoguessr-700",
  inactive:
    "bg-slate-100 text-slate-600 hover:bg-slate-200 " +
    "dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
};
export type RoundedButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    intent?: Intent;
    color?: ButtonColor;
    tone?: ButtonTone;
    size?: Size;
    fullWidth?: boolean;
    kind?: Kind;      
    active?: boolean; 
  };

export const RoundedButton = React.forwardRef<HTMLButtonElement, RoundedButtonProps>(
  (
    {
      intent = "neutral",
      color,
      tone = "soft",
      size = "md",
      fullWidth,
      className,
      type = "button",
      kind = "button",
      active = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center rounded-full outline-none transition " +
      "focus-visible:ring-2 focus-visible:ring-geoguessr-500 focus-visible:ring-offset-1 " +
      "disabled:pointer-events-none disabled:opacity-60";

    const resolvedColor: ButtonColor = color ?? INTENT_TO_COLOR[intent];

    const isChip = kind === "chip";

    const classes = [
      base,
      fullWidth ? "w-full" : "",
      isChip ? CHIP_BASE : "",
      isChip ? CHIP_SIZES[size] : SIZES[size],
      isChip ? CHIP_STATE[active ? "active" : "inactive"] : COLOR_TONES[resolvedColor][tone],
      className,
    ].filter(Boolean).join(" ");

    return (
      <button ref={ref} type={type} className={classes} disabled={disabled} {...props} />
    );
  }
);

RoundedButton.displayName = "RoundedButton";