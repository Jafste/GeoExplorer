import { useEffect, useMemo, useRef } from "react";
import { Filter } from "lucide-react";
import { RoundedInput } from "../roundedInput";
import { RoundedButton } from "../roundedButton";
import type { FilterKind } from "./DataTable";

type Props = {
  colId: string;
  label: string;
  kind: FilterKind;                 // "multi" | "single"
  options: string[];
  selected: string[];
  facetQuery: string;
  setFacetQuery: (v: string) => void;

  open: boolean;
  setOpen: (v: boolean) => void;

  onChangeSelected: (next: string[]) => void;
};

export function ColumnFilterPopover({
  label,
  kind,
  options,
  selected,
  facetQuery,
  setFacetQuery,
  open,
  setOpen,
  onChangeSelected,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, setOpen]);

  const filtered = useMemo(() => {
    const q = facetQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, facetQuery]);

  const toggle = (value: string) => {
    if (kind === "single") {
      onChangeSelected([value]);
      setOpen(false);
      return;
    }

    // multi
    if (selected.includes(value)) {
      onChangeSelected(selected.filter((x) => x !== value));
    } else {
      onChangeSelected([...selected, value]);
    }
  };

  const clear = () => onChangeSelected([]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={[
          "inline-flex items-center justify-center rounded-md p-1",
          "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
          "dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800",
        ].join(" ")}
        title={`Filter ${label}`}
      >
        <Filter className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {label}
              </span>

              {selected.length > 0 && (
                <RoundedButton
                  size="xs"
                  tone="ghost"
                  color="rose"
                  onClick={clear}
                >
                  Clear
                </RoundedButton>
              )}
            </div>

            <RoundedInput
              value={facetQuery}
              placeholder="Search values..."
              onChange={(e) => setFacetQuery(e.target.value)}
            />
          </div>

          <div className="max-h-64 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500">
                No values
              </div>
            ) : (
              filtered.map((opt) => {
                const checked = selected.includes(opt);

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span className="truncate">{opt}</span>

                    {/* Right indicator */}
                    {kind === "multi" ? (
                      <span
                        className={[
                          "ml-2 inline-flex h-4 w-4 items-center justify-center rounded border text-[10px]",
                          checked
                            ? "border-geoguessr-500 bg-geoguessr-500 text-white"
                            : "border-slate-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-900",
                        ].join(" ")}
                      >
                        ✓
                      </span>
                    ) : (
                      checked && (
                        <span className="ml-2 text-[10px] text-geoguessr-500">
                          ✓
                        </span>
                      )
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}