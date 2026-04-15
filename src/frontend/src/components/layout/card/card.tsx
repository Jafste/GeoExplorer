import React from "react";

export type CardProps = React.PropsWithChildren<{
  title?: string;
  className?: string;          // outer container
  contentClassName?: string;   // inner content wrapper
}>;

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className,
  contentClassName,
}) => {
  return (
    <div
      className={[
        "relative rounded-xl",
        "border border-slate-200 bg-white/95 shadow-sm",
        "dark:border-slate-800 dark:bg-slate-900/90",
        "transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-900",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={["p-4", contentClassName].filter(Boolean).join(" ")}>
        {title && (
          <div className="mb-2">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};