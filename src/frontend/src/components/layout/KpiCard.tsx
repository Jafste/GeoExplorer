import { Card } from "./card/card";

type KpiCardProps = {
  label: string;
  value: any;
  icon: React.ReactNode;
  title?: string;
  subtitle?: string;
  percentOfTotal?: number | null;
  rightSlot?: React.ReactNode; // e.g. mini gauge
  cardClassName?: string;
  iconWrapperClassName?: string;
  valueClassName?: string;
  percentClassName?: string;
  onClick?: () => void;
  hint?: string;
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon,
  title,
  subtitle,
  percentOfTotal,
  rightSlot,
  cardClassName,
  iconWrapperClassName,
  valueClassName,
  percentClassName,
  onClick,
  hint,
}) => {
  const hasPercent = percentOfTotal != null && !Number.isNaN(percentOfTotal);
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={[
              "flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200",
              iconWrapperClassName,
            ].filter(Boolean).join(" ")}
          >
            {icon}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" title={title}>
              {label}
            </span>
            {subtitle && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className={["text-2xl font-semibold text-slate-900 dark:text-slate-50", valueClassName].filter(Boolean).join(" ")}>
          {value}
        </span>

        {hasPercent && (
          <span
            className={[
              "rounded-full bg-slate-100 px-2 py-[2px] text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200",
              percentClassName,
            ].filter(Boolean).join(" ")}
          >
            {Math.round(percentOfTotal!)}%
          </span>
        )}
      </div>

      {hint && (
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          {hint}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full appearance-none rounded-xl border-0 bg-transparent p-0 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-geoguessr-500 focus-visible:ring-offset-2"
        title={title}
      >
        <Card
          contentClassName="p-2"
          className={[
            "flex flex-col gap-3 border border-slate-200/70 bg-white/90 shadow-sm",
            "cursor-pointer hover:-translate-y-0.5 hover:border-geoguessr-300 hover:shadow-md",
            "dark:border-slate-700/70 dark:bg-slate-900/80 dark:hover:border-geoguessr-700",
            cardClassName,
          ].filter(Boolean).join(" ")}
        >
          {content}
        </Card>
      </button>
    );
  }

  return (
    <Card
      contentClassName="p-2"
      className={[
        "flex flex-col gap-3 border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80",
        cardClassName,
      ].filter(Boolean).join(" ")}
    >
      {content}
    </Card>
  );
};
