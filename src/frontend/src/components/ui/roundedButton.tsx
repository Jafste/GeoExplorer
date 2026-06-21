import * as React from "react";

type ButtonTone = "soft" | "solid" | "ghost" | "subtle";
type Size = "sm" | "md" | "compact";
type Radius = "full" | "md" | "none";

const TONE_CLASS: Record<ButtonTone, string> = {
  soft: "button button-primary",
  solid: "button button-primary",
  ghost: "button button-ghost",
  subtle: "button button-subtle",
};

const RADIUS: Record<Radius, string> = {
  full: "rounded-full",
  md: "rounded-lg",
  none: "rounded-lg",
};

export type RoundedButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    color?: "neon";
    intent?: "primary";
    tone?: ButtonTone;
    size?: Size;
    radius?: Radius;
  };

export const RoundedButton = React.forwardRef<
  HTMLButtonElement,
  RoundedButtonProps
>(
  (
    {
      color: _color,
      intent: _intent,
      tone = "soft",
      size = "md",
      className,
      type = "button",
      radius = "full",
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center " +
      "disabled:pointer-events-none disabled:opacity-60";

    const classes = [
      base,
      RADIUS[radius],
      size === "compact" ? "button-compact" : "",
      TONE_CLASS[tone],
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
