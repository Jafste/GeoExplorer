import React from "react";

export type CardProps = React.PropsWithChildren<{
  as?: keyof React.JSX.IntrinsicElements;
  variant?:
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
  gridColumn?: React.CSSProperties["gridColumn"];
  title?: string;
  className?: string;          // outer container
  contentClassName?: string;   // inner content wrapper
  style?: React.CSSProperties;
}>;

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
  const isTactical = variant === "tactical";
  const isTacticalStack = variant === "tacticalStack";
  const isTacticalHighlight = variant === "tacticalHighlight";
  const isHomeHero = variant === "homeHero";
  const isHomeCta = variant === "homeCta";
  const isSetupPanel = variant === "setupPanel";
  const isSetupPanelStack = variant === "setupPanelStack";
  const isInset = variant === "inset";
  const isPreviewOverlay = variant === "previewOverlay";
  const usesDirectContent =
    isTactical ||
    isTacticalStack ||
    isTacticalHighlight ||
    isHomeHero ||
    isHomeCta ||
    isSetupPanel ||
    isSetupPanelStack ||
    isInset ||
    isPreviewOverlay;
  const shouldWrapContent = variant === "default" || Boolean(title || contentClassName);

  return (
    <Component
      className={[
        isHomeHero
          ? "card-home-hero"
          : isHomeCta
          ? "card-tactical card-home-cta"
          : isSetupPanelStack
          ? "card-setup-panel card-layout-stack"
          : isSetupPanel
          ? "card-setup-panel"
          : isPreviewOverlay
          ? "card-preview-overlay"
          : isInset
          ? "card-inset"
          : isTacticalHighlight
          ? "card-tactical card-tactical-highlight"
          : isTacticalStack
          ? "card-tactical card-layout-stack"
          : isTactical
          ? "card-tactical"
          : [
              "relative rounded-xl",
              "border border-slate-200 bg-white/95 shadow-sm",
              "dark:border-slate-800 dark:bg-slate-900/90",
              "transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-900",
            ].join(" "),
        gridColumn ? "card-grid-column" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...style,
        ...(gridColumn ? { gridColumn } : {}),
      }}
    >
      {shouldWrapContent ? (
        <div className={[usesDirectContent ? "" : "p-4", contentClassName].filter(Boolean).join(" ")}>
          {title && (
            <div className="mb-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                {title}
              </h3>
            </div>
          )}
          {children}
        </div>
      ) : (
        children
      )}
    </Component>
  );
};
