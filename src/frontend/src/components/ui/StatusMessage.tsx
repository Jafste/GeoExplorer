import * as React from "react";

type StatusColor = "slate" | "sky" | "emerald" | "geoguessr" | "rose";
type StatusTone = "soft" | "solid" | "outline";
type Intent = "neutral" | "info" | "success" | "primary" | "danger";
type Size = "xs" | "sm" | "md";

const INTENT_TO_COLOR: Record<Intent, StatusColor> = {
  neutral: "slate",
  info: "sky",
  success: "emerald",
  primary: "geoguessr",
  danger: "rose",
};

const STATUS_TONES: Record<StatusColor, Record<StatusTone, string>> = {
  slate: {
    soft:
      "border-slate-200 bg-slate-50 text-slate-500 " +
      "dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400",
    solid:
      "border-slate-700 bg-slate-800 text-white " +
      "dark:border-slate-700 dark:bg-slate-800 dark:text-white",
    outline:
      "border-slate-300 bg-transparent text-slate-600 " +
      "dark:border-slate-700 dark:text-slate-300",
  },

  sky: {
    soft:
      "border-sky-200 bg-sky-50 text-sky-700 " +
      "dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-200",
    solid:
      "border-sky-600 bg-sky-600 text-white " +
      "dark:border-sky-500 dark:bg-sky-600 dark:text-white",
    outline:
      "border-sky-300 bg-transparent text-sky-700 " +
      "dark:border-sky-800 dark:text-sky-300",
  },

  emerald: {
    soft:
      "border-emerald-200 bg-emerald-50 text-emerald-700 " +
      "dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200",
    solid:
      "border-emerald-600 bg-emerald-600 text-white " +
      "dark:border-emerald-500 dark:bg-emerald-600 dark:text-white",
    outline:
      "border-emerald-300 bg-transparent text-emerald-700 " +
      "dark:border-emerald-800 dark:text-emerald-300",
  },

  geoguessr: {
    soft:
      "border-geoguessr-200 bg-geoguessr-50 text-geoguessr-700 " +
      "dark:border-geoguessr-800/70 dark:bg-geoguessr-950/30 dark:text-geoguessr-200",
    solid:
      "border-geoguessr-600 bg-geoguessr-600 text-white " +
      "dark:border-geoguessr-500 dark:bg-geoguessr-600 dark:text-white",
    outline:
      "border-geoguessr-300 bg-transparent text-geoguessr-700 " +
      "dark:border-geoguessr-800 dark:text-geoguessr-300",
  },

  rose: {
    soft:
      "border-rose-200 bg-rose-50 text-rose-700 " +
      "dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200",
    solid:
      "border-rose-600 bg-rose-600 text-white " +
      "dark:border-rose-500 dark:bg-rose-600 dark:text-white",
    outline:
      "border-rose-300 bg-transparent text-rose-700 " +
      "dark:border-rose-800 dark:text-rose-300",
  },
};

const SIZES: Record<Size, string> = {
  xs: "px-2 py-1 text-[10px]",
  sm: "px-3 py-2 text-[11px]",
  md: "px-3.5 py-2.5 text-xs",
};

export type StatusMessageProps = React.HTMLAttributes<HTMLDivElement> & {
  intent?: Intent;
  color?: StatusColor;
  tone?: StatusTone;
  size?: Size;
  fullWidth?: boolean;
  icon?: React.ReactNode;
};

export function StatusMessage({
  intent = "neutral",
  color,
  tone = "soft",
  size = "sm",
  fullWidth = true,
  icon,
  className,
  children,
  ...props
}: StatusMessageProps) {
  const resolvedColor = color ?? INTENT_TO_COLOR[intent];

  const classes = [
    "dashboard-pop rounded-xl border transition-all duration-200",
    "flex items-center gap-2",
    fullWidth ? "w-full" : "",
    SIZES[size],
    STATUS_TONES[resolvedColor][tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </div>
  );
}