import type { HTMLAttributes, ReactNode } from "react";

type BadgeTone = "soft" | "highlight";
type BadgeAs = "span" | "strong";

export type BadgeProps = HTMLAttributes<HTMLElement> & {
  as?: BadgeAs;
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({
  as = "span",
  children,
  className,
  tone = "soft",
  ...props
}: BadgeProps) {
  const Component = as;

  return (
    <Component
      className={["chip", tone === "highlight" ? "chip-highlight" : "chip-soft", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
