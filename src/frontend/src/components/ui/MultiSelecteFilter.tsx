import { useState, useMemo, useEffect, useRef, useCallback, useId } from "react";
import { RoundedInput } from "./roundedInput";
import { RoundedButton } from "./roundedButton";
import { DropdownTriggerButton } from "./DropdownTriggerButton";
import { SelectOptionRow } from "./selectOptionRow";

type Primitive = string | number;

export type MultiSelectOption<T extends Primitive> = {
  value: T;
  label: string;
};

export type MultiSelectFilterProps<T extends Primitive> = {
  label: string;
  options: MultiSelectOption<T>[];
  selected: T[];
  onChange: (values: T[]) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;

  // optional: customize how the closed trigger text looks
  renderTriggerLabel?: (selected: MultiSelectOption<T>[]) => string;
};

export function MultiSelectFilter<T extends Primitive>({
  label,
  options,
  selected,
  onChange,
  placeholder = "Search...",
  disabled,
  readOnly,
  renderTriggerLabel,
}: MultiSelectFilterProps<T>) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const instanceId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const isLocked = !!disabled || !!readOnly;

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(
      new CustomEvent("dashboard-dropdown-open", { detail: { id: instanceId } })
    );
  }, [open, instanceId]);

  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<{ id: string }>;
      if (!custom.detail) return;
      if (custom.detail.id !== instanceId) setOpen(false);
    };

    window.addEventListener("dashboard-dropdown-open", listener);
    return () => window.removeEventListener("dashboard-dropdown-open", listener);
  }, [instanceId]);

  useEffect(() => {
    if (!open || isLocked) return;
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, [isLocked, open]);

  useEffect(() => {
    if (open || search === "") return;
    setSearch("");
  }, [open, search]);

  const filteredOptions = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(s));
  }, [options, search]);

  const toggleValue = useCallback(
    (val: T) => {
      if (isLocked) return;
      if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
      else onChange([...selected, val]);
    },
    [isLocked, selected, onChange]
  );

  const handleSelectAllVisible = () => {
    if (isLocked) return;
    const visibleValues = filteredOptions.map((o) => o.value);
    const union = Array.from(new Set([...selected, ...visibleValues]));
    onChange(union);
  };

  const handleClearAll = () => {
    if (isLocked) return;
    onChange([]);
  };

  const selectedOptions = useMemo(
    () => options.filter((o) => selected.includes(o.value)),
    [options, selected]
  );

  const triggerText =
    renderTriggerLabel?.(selectedOptions) ??
    (selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
      ? selectedOptions[0].label
      : `${selectedOptions.length} selected`);

  return (
    <div ref={containerRef} className="flex flex-col gap-1">
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        <span>{label}</span>
      </div>

      <div className="relative">
        <DropdownTriggerButton
          onClick={() => {
            if (isLocked) return;
            setOpen((p) => !p);
          }}
          text={triggerText}
          placeholder={placeholder}
          open={open}
          disabled={isLocked}
        />

        {open && (
          <div className="dashboard-pop dashboard-glow absolute z-30 mt-2 max-h-72 w-full origin-top overflow-auto rounded-2xl border border-slate-200 bg-white text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 p-2 dark:border-slate-700">
              <RoundedInput
                ref={searchInputRef}
                value={search}
                placeholder={placeholder}
                onChange={(e) => setSearch(e.target.value)}
                disabled={isLocked}
              />

              <div className="mt-2 flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <RoundedButton
                  size="xs"
                  color="geoguessr"
                  tone="ghost"
                  onClick={handleSelectAllVisible}
                  disabled={isLocked}
                >
                  <span className="font-medium uppercase tracking-[0.16em]">
                    Select visible
                  </span>
                </RoundedButton>

                <RoundedButton
                  size="xs"
                  color="rose"
                  tone="ghost"
                  onClick={handleClearAll}
                  disabled={isLocked}
                >
                  <span className="font-medium uppercase tracking-[0.16em]">
                    Clear
                  </span>
                </RoundedButton>
              </div>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500">
                No results
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <SelectOptionRow
                  key={String(opt.value)}
                  mode="multi"
                  label={opt.label}
                  selected={selected.includes(opt.value)}
                  disabled={isLocked}
                  onClick={() => toggleValue(opt.value)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
