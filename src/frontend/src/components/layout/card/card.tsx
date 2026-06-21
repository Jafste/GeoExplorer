import React from "react";

export type CardVariant =
  | "tactical"
  | "tacticalStack"
  | "tacticalHighlight"
  | "homeHero"
  | "setupPanel"
  | "setupPanelStack"
  | "inset";

export type CardProps = React.PropsWithChildren<{
  as?: keyof React.JSX.IntrinsicElements;
  variant: CardVariant;
  gridColumn?: React.CSSProperties["gridColumn"];
  className?: string;
  style?: React.CSSProperties;
}>;

const cardVariantClassNames: Record<CardVariant, string> = {
  tactical: "card-tactical",
  tacticalStack: "card-tactical card-layout-stack",
  tacticalHighlight: "card-tactical card-tactical-highlight",
  homeHero: "card-home-hero",
  setupPanel: "card-setup-panel",
  setupPanelStack: "card-setup-panel card-layout-stack",
  inset: "card-inset",
};

export const Card: React.FC<CardProps> = ({
  as,
  variant,
  gridColumn,
  children,
  className,
  style,
}) => {
  const Component = as ?? "div";
  const classNames = [
    cardVariantClassNames[variant],
    gridColumn ? "card-grid-column" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const cardStyle = {
    ...style,
    ...(gridColumn ? { gridColumn } : {}),
  };

  return (
    <Component className={classNames} style={cardStyle}>
      {children}
    </Component>
  );
};
