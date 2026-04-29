import * as React from "react";

type ButtonColor = "slate" | "emerald" | "geoguessr" | "rose" | "neon";
type ButtonTone = "soft" | "solid" | "outline" | "ghost" | "subtle";
type Intent = "neutral" | "primary" | "success" | "danger";
type Size = "xs" | "sm" | "md" | "compact";
type Kind = "button" | "chip";
type Radius = "full" | "md" | "none";

const NEON_BUTTON =
  "button button-primary";

const NEON_GHOST_BUTTON =
  "button button-ghost";

const NEON_SUBTLE_BUTTON = "button button-subtle";

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
    subtle:
      "border border-[var(--line)] bg-[rgba(10,13,22,0.9)] text-[var(--text-soft)]",
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
    subtle:
      "border border-[var(--line)] bg-[rgba(10,13,22,0.9)] text-[var(--text-soft)]",
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
    subtle:
      "border border-[var(--line)] bg-[rgba(10,13,22,0.9)] text-[var(--text-soft)]",
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
    subtle:
      "border border-[var(--line)] bg-[rgba(10,13,22,0.9)] text-[var(--text-soft)]",
  },

  neon: {
    soft: NEON_BUTTON,
    solid: NEON_BUTTON,
    outline: NEON_BUTTON,
    ghost: NEON_GHOST_BUTTON,
    subtle: NEON_SUBTLE_BUTTON,
  },
};

const INTENT_TO_COLOR: Record<Intent, ButtonColor> = {
  neutral: "slate",
  primary: "neon",
  success: "emerald",
  danger: "rose",
};

const SIZES: Record<Size, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
  compact: "min-h-10 px-3.5 text-[0.92rem]",
};

const CHIP_BASE = "font-semibold uppercase tracking-[0.16em]";

const CHIP_SIZES: Record<Size, string> = {
  xs: "px-2 py-[3px] text-[10px]",
  sm: "px-2.5 py-[3px] text-[10px]",
  md: "px-3 py-1 text-[11px]",
  compact: "px-3 py-1 text-[11px]",
};

const CHIP_STATE: Record<"active" | "inactive", string> = {
  active: "bg-geoguessr-600 text-white hover:bg-geoguessr-700",
  inactive:
    "bg-slate-100 text-slate-600 hover:bg-slate-200 " +
    "dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
};

const RADIUS: Record<Radius, string> = {
  full: "rounded-full",
  md: "rounded-md",
  none: "rounded-none",
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
    radius?: Radius;
  };

export const RoundedButton = React.forwardRef<
  HTMLButtonElement,
  RoundedButtonProps
>(
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
      radius = "full",
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center outline-none " +
      "disabled:pointer-events-none disabled:opacity-60";

    const resolvedColor: ButtonColor = color ?? INTENT_TO_COLOR[intent];
    const isChip = kind === "chip";
    const isNeon = resolvedColor === "neon";

    const classes = [
      base,
      RADIUS[radius],
      fullWidth ? "w-full" : "",
      isChip ? CHIP_BASE : "",
      isChip
        ? CHIP_SIZES[size]
        : isNeon
          ? size === "compact"
            ? "button-compact"
            : ""
          : SIZES[size],
      isChip
        ? CHIP_STATE[active ? "active" : "inactive"]
        : COLOR_TONES[resolvedColor][tone],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled}
        {...props}
      />
    );
  }
);

RoundedButton.displayName = "RoundedButton";
