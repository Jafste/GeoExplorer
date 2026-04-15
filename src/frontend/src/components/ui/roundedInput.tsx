import * as React from "react";

type InputColor = "slate" | "emerald" | "geoguessr" | "rose";
type InputTone = "soft" | "outline";
type Intent = "neutral" | "primary" | "success" | "danger";
type Size = "xs" | "sm" | "md";
type Variant = "default" | "list";

const INTENT_TO_COLOR: Record<Intent, InputColor> = {
  neutral: "slate",
  primary: "geoguessr",
  success: "emerald",
  danger: "rose",
};

const SIZES: Record<Size, string> = {
  xs: "px-3 py-0.5 text-[10px]",
  sm: "px-3 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
};

const TEXTAREA_SIZES: Record<Size, string> = {
  xs: "px-3 py-1 text-[10px]",
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-3 py-2 text-xs",
};

const COLOR_TONES: Record<InputColor, Record<InputTone, string>> = {
  slate: {
    soft:
      "border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 " +
      "hover:border-slate-300 " +
      "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600",
    outline:
      "border border-slate-300 bg-transparent text-slate-700 placeholder:text-slate-400 " +
      "hover:border-slate-400 " +
      "dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500",
  },

  emerald: {
    soft:
      "border border-emerald-300 bg-emerald-50/60 text-emerald-900 placeholder:text-emerald-700/50 " +
      "hover:border-emerald-400 " +
      "dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100 dark:placeholder:text-emerald-300/40 dark:hover:border-emerald-600",
    outline:
      "border border-emerald-500 bg-transparent text-emerald-900 placeholder:text-emerald-700/50 " +
      "hover:border-emerald-600 " +
      "dark:text-emerald-100 dark:placeholder:text-emerald-300/40",
  },

  geoguessr: {
    soft:
      "border border-geoguessr-300 bg-geoguessr-50/60 text-slate-900 placeholder:text-slate-500 " +
      "hover:border-geoguessr-400 " +
      "dark:border-geoguessr-700 dark:bg-geoguessr-950/25 dark:text-slate-50 dark:placeholder:text-slate-400 dark:hover:border-geoguessr-600",
    outline:
      "border border-geoguessr-500 bg-transparent text-slate-900 placeholder:text-slate-500 " +
      "hover:border-geoguessr-600 " +
      "dark:text-slate-50 dark:placeholder:text-slate-400",
  },

  rose: {
    soft:
      "border border-rose-300 bg-rose-50/60 text-rose-950 placeholder:text-rose-700/50 " +
      "hover:border-rose-400 " +
      "dark:border-rose-700 dark:bg-rose-950/25 dark:text-rose-50 dark:placeholder:text-rose-300/40 dark:hover:border-rose-600",
    outline:
      "border border-rose-500 bg-transparent text-rose-950 placeholder:text-rose-700/50 " +
      "hover:border-rose-600 " +
      "dark:text-rose-50 dark:placeholder:text-rose-300/40",
  },
};

export type RoundedInputProps =
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
    intent?: Intent;
    color?: InputColor;
    tone?: InputTone;
    size?: Size;
    fullWidth?: boolean;
    variant?: Variant;
  };

export const RoundedInput = React.forwardRef<HTMLInputElement, RoundedInputProps>(
  (
    {
      intent = "neutral",
      color,
      tone = "soft",
      size = "sm",
      fullWidth = true,
      variant = "default",
      className,
      type = "text",
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const resolvedColor: InputColor = color ?? INTENT_TO_COLOR[intent];

    const base =
      "block w-full rounded-full outline-none transition " +
      "shadow-sm " +
      "focus-visible:ring-2 focus-visible:ring-geoguessr-200 focus-visible:ring-offset-1 " +
      "disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed " +
      "read-only:opacity-80 read-only:cursor-default";

    // Keeps the input height “button-like” in flex rows (avoids weird shrink)
    const layout = "min-w-0";

    // Small “list” variant tweak: slightly tighter + a touch less background
    const variantCls =
      variant === "list"
        ? "bg-white/70 dark:bg-slate-800/70"
        : "";

    const polish =
      "caret-slate-700 dark:caret-slate-100 " +
      "focus-visible:ring-offset-slate-200 dark:focus-visible:ring-offset-slate-900";

    const classes = [
      base,
      layout,
      fullWidth ? "w-full" : "w-auto",
      SIZES[size],
      COLOR_TONES[resolvedColor][tone],
      variantCls,
      polish,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <input
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={props["aria-invalid"]}
        {...props}
      />
    );
  }
);

RoundedInput.displayName = "RoundedInput";

/**
 * same style system for textarea.
 */
export type RoundedTextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    intent?: Intent;
    color?: InputColor;
    tone?: InputTone;
    size?: Size;
    fullWidth?: boolean;
    variant?: Variant;
  };

export const RoundedTextarea = React.forwardRef<HTMLTextAreaElement, RoundedTextareaProps>(
  (
    {
      intent = "neutral",
      color,
      tone = "soft",
      size = "sm",
      fullWidth = true,
      variant = "default",
      className,
      disabled,
      readOnly,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const resolvedColor: InputColor = color ?? INTENT_TO_COLOR[intent];

    const base =
      "block w-full rounded-2xl outline-none transition shadow-sm " +
      "focus-visible:ring-2 focus-visible:ring-geoguessr-200 focus-visible:ring-offset-1 " +
      "disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed " +
      "read-only:opacity-80 read-only:cursor-default";

    const variantCls =
      variant === "list"
        ? "bg-white/70 dark:bg-slate-800/70"
        : "";

    const polish =
      "min-w-0 resize-none " +
      "caret-slate-700 dark:caret-slate-100 " +
      "focus-visible:ring-offset-slate-200 dark:focus-visible:ring-offset-slate-900";

    const classes = [
      base,
      fullWidth ? "w-full" : "w-auto",
      TEXTAREA_SIZES[size],
      COLOR_TONES[resolvedColor][tone],
      variantCls,
      polish,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <textarea
        ref={ref}
        className={classes}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        {...props}
      />
    );
  }
);

RoundedTextarea.displayName = "RoundedTextarea";
