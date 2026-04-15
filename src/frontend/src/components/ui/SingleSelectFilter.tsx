import { useDeferredValue, useState, useId, useRef, useEffect, useMemo } from "react";
import { RoundedInput } from "./roundedInput";
import { DropdownTriggerButton } from "./DropdownTriggerButton";
import { SelectOptionRow } from "./selectOptionRow";

type Primitive = string | number;

type Option<T extends Primitive> = { value: T; label: string };

type SingleSelectBaseProps<T extends Primitive> = {
  label: string;
  options: Option<T>[];
  value: T | "all";
  onChange: (value: T | "all") => void;
  allLabel?: string;
  placeholder?: string;
  includeAll?: boolean;

  size?: "xs" | "sm" | "md";

  disabled?: boolean;
  readOnly?: boolean;

  allowCreate?: boolean;
  createLabel?: (typed: string) => string;
  onCreateOption?: (typed: string) => void | Promise<void>;
  noOptionsMessage?: string | ((typed: string) => string);
  emptyActionLabel?: (typed: string) => string;
  onEmptyAction?: (typed: string) => void | Promise<void>;
  minSearchChars?: number;
  maxVisibleOptions?: number;
};

export function SingleSelectFilter<T extends Primitive>({
  label,
  options,
  value,
  onChange,
  allLabel = "All",
  placeholder = "Select...",
  includeAll = true,
  size,
  disabled,
  readOnly,
  allowCreate,
  createLabel,
  onCreateOption,
  noOptionsMessage,
  emptyActionLabel,
  onEmptyAction,
  minSearchChars = 0,
  maxVisibleOptions,
}: SingleSelectBaseProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const instanceId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const isLocked = !!disabled || !!readOnly;
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

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
      if (custom?.detail?.id && custom.detail.id !== instanceId) setOpen(false);
    };

    window.addEventListener("dashboard-dropdown-open", listener);
    return () => window.removeEventListener("dashboard-dropdown-open", listener);
  }, [instanceId]);

  useEffect(() => {
    if (!(isLocked && open)) return;

    const timeout = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timeout);
  }, [isLocked, open]);

  useEffect(() => {
    if (!open || isLocked) return;
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, [isLocked, open]);

  useEffect(() => {
    if (open || search === "") return;
    setSearch("");
  }, [open, search]);

  const displayOptions = useMemo(() => {
    const base = options.map((o) => ({ value: o.value as T | "all", label: o.label }));
    return includeAll ? [{ value: "all" as const, label: allLabel }, ...base] : base;
  }, [options, includeAll, allLabel]);

  const currentLabel =
    displayOptions.find((o) => o.value === value)?.label ?? placeholder;

  const hasEnoughSearch = normalizedSearch.length >= minSearchChars;

  const {
    filteredOptions,
    totalMatchingOptions,
    isTruncated,
  } = useMemo(() => {
    if (!hasEnoughSearch) {
      const preserved = displayOptions.filter(
        (opt) => opt.value === "all" || opt.value === value
      );
      const deduped = preserved.filter(
        (opt, index, arr) => arr.findIndex((candidate) => candidate.value === opt.value) === index
      );

      return {
        filteredOptions: deduped,
        totalMatchingOptions: deduped.length,
        isTruncated: false,
      };
    }

    const matches = !normalizedSearch
      ? displayOptions
      : displayOptions.filter((opt) => opt.label.toLowerCase().includes(normalizedSearch));

    const limited =
      typeof maxVisibleOptions === "number" && maxVisibleOptions > 0
        ? matches.slice(0, maxVisibleOptions)
        : matches;

    return {
      filteredOptions: limited,
      totalMatchingOptions: matches.length,
      isTruncated: limited.length < matches.length,
    };
  }, [displayOptions, hasEnoughSearch, maxVisibleOptions, normalizedSearch, value]);

  const exactMatchExists = useMemo(() => {
    if (!normalizedSearch || !hasEnoughSearch) return false;
    return options.some((o) => o.label.trim().toLowerCase() === normalizedSearch);
  }, [hasEnoughSearch, options, normalizedSearch]);

  const showCreate =
    !isLocked &&
    !!allowCreate &&
    hasEnoughSearch &&
    normalizedSearch.length > 0 &&
    !exactMatchExists &&
    totalMatchingOptions === 0;

  const showEmptyAction =
    !isLocked &&
    !showCreate &&
    hasEnoughSearch &&
    totalMatchingOptions === 0 &&
    !!normalizedSearch &&
    !!onEmptyAction;

  const resolvedNoOptionsMessage =
    typeof noOptionsMessage === "function"
      ? noOptionsMessage(search.trim())
      : (noOptionsMessage ?? "No results");

  const resolvedEmptyActionLabel =
    typeof emptyActionLabel === "function"
      ? emptyActionLabel(search.trim())
      : (emptyActionLabel ?? "Use this value");

  const handleSelect = (val: T | "all") => {
    if (isLocked) return;
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1">
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </div>

      <div className="relative">
        <DropdownTriggerButton
          onClick={() => {
            if (isLocked) return;
            setOpen((p) => !p);
          }}
          text={currentLabel}
          placeholder={placeholder}
          size={size}
          open={open}
          disabled={disabled}
        />

        {open && (
          <div className="dashboard-pop dashboard-glow absolute z-30 mt-2 max-h-72 w-full origin-top overflow-auto rounded-2xl border border-slate-200 bg-white text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 p-2 dark:border-slate-700">
              <RoundedInput
                ref={searchInputRef}
                value={search}
                placeholder={
                  minSearchChars > 0
                    ? `Type at least ${minSearchChars} character${minSearchChars === 1 ? "" : "s"}...`
                    : placeholder
                }
                onChange={(e) => setSearch(e.target.value)}
                disabled={isLocked}
              />
            </div>

            {!hasEnoughSearch && (
              <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">
                Type at least {minSearchChars} character{minSearchChars === 1 ? "" : "s"} to search{" "}
                {options.length.toLocaleString()} option{options.length === 1 ? "" : "s"}.
              </div>
            )}

            {hasEnoughSearch && filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">
                {resolvedNoOptionsMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <SelectOptionRow
                  key={String(opt.value)}
                  mode="single"
                  label={opt.label}
                  selected={value === opt.value}
                  disabled={isLocked}
                  onClick={() => handleSelect(opt.value)}
                />
              ))
            )}

            {hasEnoughSearch && isTruncated && (
              <div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
                Showing first {filteredOptions.length} of {totalMatchingOptions} results. Keep typing to narrow it down.
              </div>
            )}

            {showCreate && (
              <button
                type="button"
                onClick={async () => {
                  await onCreateOption?.(search.trim());
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full rounded-lg border border-dashed border-geoguessr-300 bg-geoguessr-50/70 px-3 py-2 text-left text-sm transition-all duration-200
                           hover:-translate-y-px hover:bg-geoguessr-100 dark:border-geoguessr-700 dark:bg-geoguessr-950/30 dark:hover:bg-geoguessr-950/50"
              >
                {createLabel?.(search.trim()) ?? `Create "${search.trim()}"`}
              </button>
            )}

            {showEmptyAction && (
              <button
                type="button"
                onClick={async () => {
                  await onEmptyAction?.(search.trim());
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-3 py-2 text-left text-sm transition-all duration-200
                           hover:-translate-y-px hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/70"
              >
                {resolvedEmptyActionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
