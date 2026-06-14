import React from "react";

export type CardVariant =
  | "default"
  | "tactical"
  | "tacticalStack"
  | "tacticalHighlight"
  | "homeHero"
  | "homeCta"
  | "setupPanel"
  | "setupPanelStack"
  | "inset"
  | "previewOverlay";

export type CardProps = React.PropsWithChildren<{
  as?: keyof React.JSX.IntrinsicElements;
  variant?: CardVariant;
  gridColumn?: React.CSSProperties["gridColumn"];
  title?: string;
  className?: string;
  contentClassName?: string;
  style?: React.CSSProperties;
}>;

const defaultCardClassName = [
  "relative rounded-xl",
  "border border-slate-200 bg-white/95 shadow-sm",
  "dark:border-slate-800 dark:bg-slate-900/90",
  "transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-900",
].join(" ");

const cardVariantClassNames: Record<CardVariant, string> = {
  default: defaultCardClassName,
  tactical: "card-tactical",
  tacticalStack: "card-tactical card-layout-stack",
  tacticalHighlight: "card-tactical card-tactical-highlight",
  homeHero: "card-home-hero",
  homeCta: "card-tactical card-home-cta",
  setupPanel: "card-setup-panel",
  setupPanelStack: "card-setup-panel card-layout-stack",
  inset: "card-inset",
  previewOverlay: "card-preview-overlay",
};

export const Card: React.FC<CardProps> = ({
  as,
  variant = "default",
  gridColumn,
  title,
  children,
  className,
  contentClassName,
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
  const titleElement = title ? (
    <div className="mb-2">
      <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50">
        {title}
      </h3>
    </div>
  ) : null;
  const shouldWrapContent = variant === "default" || Boolean(contentClassName);
  const contentWrapperClassName = [
    variant === "default" ? "p-4" : "",
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classNames} style={cardStyle}>
      {shouldWrapContent ? (
        <div className={contentWrapperClassName}>
          {titleElement}
          {children}
        </div>
      ) : (
        <>
          {titleElement}
          {children}
        </>
      )}
    </Component>
  );
};
