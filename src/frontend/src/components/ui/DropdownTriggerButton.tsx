// DropdownTriggerButton.tsx (example patch)
type Size = "xs" | "sm" | "md";

const SIZES: Record<Size, string> = {
  xs: "px-3 py-0.5 text-[10px]",
  sm: "px-3 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
};

export type DropdownTriggerButtonProps = {
  onClick: () => void;
  text: string;
  placeholder?: string;
  size?: Size;                 // NEW
  className?: string;
  open?: boolean;
  disabled?: boolean;
};

export function DropdownTriggerButton({
  onClick,
  text,
  placeholder,
  size = "sm",
  className,
  open = false,
  disabled = false,
}: DropdownTriggerButtonProps) {
  const base =
    "w-full rounded-full border text-left outline-none transition-all duration-200 ease-out " +
    "focus-visible:ring-2 focus-visible:ring-geoguessr-500 focus-visible:ring-offset-1 " +
    "border-slate-200 bg-slate-50 text-slate-700 shadow-sm hover:-translate-y-px hover:border-slate-300 hover:bg-white " +
    "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800/90";

  const display = text?.trim() ? text : (placeholder ?? "Select...");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        base,
        SIZES[size],
        "flex items-center justify-between gap-2",
        disabled ? "cursor-not-allowed opacity-60 hover:translate-y-0" : "",
        open
          ? "border-geoguessr-300 bg-white text-slate-900 shadow-[0_10px_24px_-18px_rgba(26,179,148,0.65)] dark:border-geoguessr-700 dark:bg-slate-900"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="min-w-0 flex-1 truncate">{display}</span>
      <span
        className={[
          "shrink-0 text-slate-400 transition-transform duration-200 ease-out",
          open ? "rotate-180 text-geoguessr-600 dark:text-geoguessr-400" : "",
        ].join(" ")}
      >
        ▾
      </span>
    </button>
  );
}
