import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { RoundedInput } from "../roundedInput";
import { RoundedButton } from "../roundedButton";
import { ColumnFilterPopover } from "./datatableFilePopover";
import { SingleSelectFilter } from "../SingleSelectFilter";
import { smartMatch } from "../../../utilities/search";
// adjust imports to your folders

export type SortDir = "asc" | "desc";
export type FilterKind = "multi" | "single" | "text";
type PaginationMode = "none" | "client"; // deixa "server" para depois


export type DataTableColumn<T> = {
  id: string;
  label: string;
  widthClass?: string;
  width?: string | number;//200 or 200px or 20%
  minWidth?: number;          // px
  maxWidth?: number;          // px
  resizable?: boolean;
  cellPresentation?: "default" | "truncate" | "wrap";
  cellClassName?: string | ((row: T) => string);
  cellTitle?: (row: T) => string | undefined;
  
  cell: (row: T) => React.ReactNode;

  // sorting
  sortValue?: (row: T) => string | number | Date | null | undefined;

  // filters/search
  filterKind?: FilterKind;
  filterValue?: (row: T) => string | null;

  searchable?: boolean; // default true
  searchValue?: (row: T) => string;

  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
};

type DataTableProps<T> = {
  title?: string;
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => React.Key;
  initialSortId?: string | null;
  initialSortDir?: SortDir;

  emptyText?: string;

  maxRows?: number;
  initialRows?: number;
  pageStep?: number;
  maxHeightClassName?: string;
  minHeightClassName?: string;
  className?: string;

  enableSearch?: boolean;
  searchPlaceholder?: string;
  maxFacetValues?: number;

  //pagging
  pageMode?: PaginationMode;       
  pageSizeOptions?: number[];      
  defaultPageSize?: number;        

  renderMobileCard?: (row: T) => React.ReactNode;
  desktopBreakpoint?: "md" | "lg" | "xl";

  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
};

export function DataTable<T>({
  title,
  rows,
  columns,
  getRowKey,
  initialSortId,
  initialSortDir = "asc",
  emptyText = "No results.",
  maxRows = 300,
  initialRows = 10,
  pageStep = 20,
  maxHeightClassName = "max-h-96",
  minHeightClassName = "min-h-96",
  className,
  enableSearch = true,
  searchPlaceholder = "Search...",
  maxFacetValues = 250,
  renderMobileCard,
  //paging mode
  pageMode: pageModeProp = "none",
  pageSizeOptions: pageSizeOptionsProp = [10, 20, 50, 100],
  defaultPageSize: defaultPageSizeProp = 20,
  desktopBreakpoint = "md",
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {

  const defaultWidth = (c: DataTableColumn<T>) =>
    c.width ?? c.widthClass ?? undefined;

  const [colWidths, setColWidths] = useState<Record<string, string | number>>(() => {
    const entries: Array<[string, string | number]> = [];

    for (const c of columns) {
      const w = defaultWidth(c);
      if (w != null) entries.push([c.id, w]);
    }

    return Object.fromEntries(entries);
  });

  // keep widths when columns list changes (new cols only)
  useEffect(() => {
    setColWidths((prev) => {
      const next = { ...prev };
      for (const c of columns) {
        if (next[c.id] == null && defaultWidth(c) != null) {
          next[c.id] = defaultWidth(c)!;
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  const widthToPx = (w: string | number | undefined, tablePx: number) => {
    if (w == null) return undefined;
    if (typeof w === "number") return w;
    const s = String(w).trim();
    if (s.endsWith("%")) return (parseFloat(s) / 100) * tablePx;
    if (s.endsWith("px")) return parseFloat(s);
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const pxToWidth = (px: number, original: string | number | undefined, tablePx: number) => {
    if (original == null) return px; // default px
    if (typeof original === "number") return px;
    const s = String(original).trim();
    if (s.endsWith("%")) return `${(px / tablePx) * 100}%`;
    return px;
  };

  const tableMinWidthPx = useMemo(() => {
    return columns.reduce((total, col) => {
      const configuredWidth = colWidths[col.id] ?? col.width;

      if (typeof configuredWidth === "number") {
        return total + configuredWidth;
      }

      if (typeof configuredWidth === "string") {
        const trimmed = configuredWidth.trim();

        if (trimmed.endsWith("px")) {
          return total + parseFloat(trimmed);
        }

        if (trimmed.endsWith("%")) {
          return total + (col.minWidth ?? 180);
        }

        const numericWidth = Number(trimmed);
        if (Number.isFinite(numericWidth)) {
          return total + numericWidth;
        }
      }

      return total + (col.minWidth ?? 140);
    }, 0);
  }, [colWidths, columns]);

  const resolveCellPresentationClassName = useCallback(
    (col: DataTableColumn<T>) => {
      if (col.cellPresentation === "truncate") {
        return "block max-w-full truncate";
      }

      if (col.cellPresentation === "wrap") {
        return "block max-w-full whitespace-normal break-words";
      }

      return "";
    },
    []
  );

  const resolveCellClassName = useCallback(
    (col: DataTableColumn<T>, row: T) => {
      const customClassName =
        typeof col.cellClassName === "function" ? col.cellClassName(row) : col.cellClassName;

      return [
        "min-w-0",
        resolveCellPresentationClassName(col),
        customClassName,
      ]
        .filter(Boolean)
        .join(" ");
    },
    [resolveCellPresentationClassName]
  );

  const startResize = (colId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const th = (e.currentTarget as HTMLElement).closest("th") as HTMLTableCellElement | null;
    const table = th?.closest("table") as HTMLTableElement | null;
    if (!th || !table) return;

    const tableRect = table.getBoundingClientRect();
    const startX = e.clientX;

    const col = columns.find((c) => c.id === colId);
    if (!col) return;

    const current = colWidths[colId] ?? col.width;
    const startPx =
      widthToPx(current, tableRect.width) ??
      th.getBoundingClientRect().width;

    const minPx = col.minWidth ?? 80;
    const maxPx = col.maxWidth ?? 800;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const nextPx = Math.min(maxPx, Math.max(minPx, startPx + dx));
      setColWidths((p) => ({
        ...p,
        [colId]: pxToWidth(nextPx, current, tableRect.width),
      }));
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.classList.remove("select-none");
    };

    document.body.classList.add("select-none");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const sortableCols = useMemo(
    () => columns.filter((c) => !!c.sortValue),
    [columns]
  );

  const [sortId, setSortId] = useState<string>(
    initialSortId === null
      ? ""
      : initialSortId ?? sortableCols[0]?.id ?? columns[0]?.id ?? ""
  );
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);

  useEffect(() => {
    setSortId(
      initialSortId === null
        ? ""
        : initialSortId ?? sortableCols[0]?.id ?? columns[0]?.id ?? ""
    );
  }, [columns, initialSortId, sortableCols]);

  useEffect(() => {
    setSortDir(initialSortDir);
  }, [initialSortDir]);

  // Search + column filters
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 180);
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});

  const filterableCols = useMemo(
    () => columns.filter((c) => !!c.filterKind && !!c.filterValue),
    [columns]
  );
  const [openFilterColId, setOpenFilterColId] = useState<string | null>(null);
  const [facetQueryByCol, setFacetQueryByCol] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!openFilterColId) return;
    // when opening a new column, clear its facet search
    setFacetQueryByCol((p) => ({ ...p, [openFilterColId]: "" }));
  }, [openFilterColId]);

  const applyFilters = (
    input: T[],
    excludeColId?: string
  ) => {
    let r = input;

    // column filters (exclude one col)
    for (const col of filterableCols) {
      if (col.id === excludeColId) continue;

      const selected = colFilters[col.id];
      if (!selected?.length) continue;

      const selectedSet = new Set(selected);
      r = r.filter((row) => {
        const v = col.filterValue!(row);
        return v != null && selectedSet.has(v);
      });
    }

    // global search (optional: include it so facets also shrink by search)
    const q = debouncedQuery.trim().toLowerCase();
    if (enableSearch && q) {
      const searchCols = columns.filter((c) => c.searchable !== false);

      r = r.filter((row) => {
        const hay = searchCols
          .map((c) => {
            if (c.searchValue) return c.searchValue(row);
            if (c.filterValue) return c.filterValue(row) ?? "";
            if (c.sortValue) {
              const v = c.sortValue(row);
              if (v == null) return "";
              if (v instanceof Date) return v.toISOString();
              return String(v);
            }
            return "";
          })
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return smartMatch(hay, debouncedQuery);
      });
    }

    return r;
  };
  // Facets: distinct values per column (from ALL rows)
  const facets = useMemo(() => {
    const map: Record<string, string[]> = {};

    for (const col of filterableCols) {
      const baseRows = applyFilters(rows, col.id); 
      const set = new Set<string>();

      for (const row of baseRows) {
        const v = col.filterValue!(row);
        if (!v) continue;
        set.add(v);
        if (set.size >= maxFacetValues) break;
      }

      map[col.id] = Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    return map;
  }, [rows, filterableCols, colFilters, debouncedQuery, enableSearch, maxFacetValues, columns]);

  // Apply filters + search
  const filteredRows = useMemo(() => {
    let r = rows;

    // Column filters
    for (const col of filterableCols) {
      const selected = colFilters[col.id];
      if (!selected?.length) continue;

      const selectedSet = new Set(selected);
      r = r.filter((row) => {
        const v = col.filterValue!(row);
        return v != null && selectedSet.has(v);
      });
    }

    // Global search (across searchable columns)
    const q = debouncedQuery.trim().toLowerCase();
    if (enableSearch && q) {
      const searchCols = columns.filter((c) => c.searchable !== false);

      r = r.filter((row) => {
        const hay = searchCols
          .map((c) => {
            if (c.searchValue) return c.searchValue(row);
            if (c.filterValue) return c.filterValue(row) ?? "";
            if (c.sortValue) {
              const v = c.sortValue(row);
              if (v == null) return "";
              if (v instanceof Date) return v.toISOString();
              return String(v);
            }
            return "";
          })
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return smartMatch(hay, debouncedQuery);
      });
    }

    return r;
  }, [rows, columns, filterableCols, colFilters, debouncedQuery, enableSearch]);

  const sortCol = useMemo(
    () => columns.find((c) => c.id === sortId),
    [columns, sortId]
  );

  // Sort AFTER filtering
  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    const getter = sortCol?.sortValue;
    if (!getter) return copy;

    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va = getter(a);
      const vb = getter(b);

      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;

      const av = va instanceof Date ? va.getTime() : va;
      const bv = vb instanceof Date ? vb.getTime() : vb;

      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    return copy;
  }, [filteredRows, sortCol, sortDir]);

  const [fadeIn, setFadeIn] = useState(true);
  const desktopScrollRef = useRef<HTMLDivElement | null>(null);
  const [desktopScrollState, setDesktopScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    canScrollDown: false,
    hasVerticalOverflow: false,
  });

  const updateDesktopScrollState = useCallback(() => {
    const el = desktopScrollRef.current;
    if (!el) return;

    const next = {
      canScrollLeft: el.scrollLeft > 4,
      canScrollRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      canScrollDown: el.scrollTop > 4,
      hasVerticalOverflow: el.scrollHeight > el.clientHeight + 4,
    };

    setDesktopScrollState((prev) =>
      prev.canScrollLeft === next.canScrollLeft &&
      prev.canScrollRight === next.canScrollRight &&
      prev.canScrollDown === next.canScrollDown &&
      prev.hasVerticalOverflow === next.hasVerticalOverflow
        ? prev
        : next
    );
  }, []);

  useEffect(() => {
    // start fade-out immediately
    setFadeIn(false);

    // then fade-in after a short delay (feels smoother than rAF)
    const t = window.setTimeout(() => setFadeIn(true), 120);

    return () => window.clearTimeout(t);
  }, [
    sortId,
    sortDir,
    debouncedQuery,
    JSON.stringify(colFilters), // ok for now; later we can optimize
  ]);

  // Mobile paging
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(initialRows, maxRows, sortedRows.length)
  );

  // Reset/adjust paging when *filtered result* changes
  useEffect(() => {
    setVisibleCount(Math.min(initialRows, maxRows, sortedRows.length));
  }, [sortedRows.length, maxRows, initialRows]);

  const totalCap = Math.min(sortedRows.length, maxRows);



  // Mobile: progressive load
  const mobileLimit = Math.min(visibleCount, totalCap);
  const mobileRows = useMemo(
    () => sortedRows.slice(0, mobileLimit),
    [sortedRows, mobileLimit]
  );
  const canShowMoreMobile = mobileLimit < totalCap;

  const toggleSort = (id: string) => {
    setSortId((prev) => {
      if (prev === id) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return id;
    });
  };

  const indicator = (id: string) =>
    sortId === id ? (sortDir === "asc" ? "▲" : "▼") : null;

  const hasActiveFilters =
    debouncedQuery.trim().length > 0 ||
    Object.values(colFilters).some((arr) => arr?.length);

  const clearAll = () => {
    setQuery("");
    setColFilters({});
    setOpenFilterColId(null);
  };
  

  //paging
  const pageMode = pageModeProp ?? "none";
  const pageSizeOptions = pageSizeOptionsProp ?? [10, 20, 50, 100];

  const [pageSize, setPageSize] = useState<number>(defaultPageSizeProp ?? 20);
  const [pageIndex, setPageIndex] = useState(0);

  //changes total page rows when in page mode
  const totalPages = pageMode === "client"
    ? Math.max(1, Math.ceil(totalCap / pageSize))
    : 1;

  const pagedRows = useMemo(() => {
    if (pageMode !== "client") return sortedRows.slice(0, totalCap);

    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return sortedRows.slice(start, Math.min(end, totalCap));
  }, [pageMode, sortedRows, pageIndex, pageSize, totalCap]);
  useEffect(() => {
  setPageIndex(0);
}, [sortId, sortDir, debouncedQuery, JSON.stringify(colFilters)]);
const desktopRows = pagedRows;
  const visibleRowCount = pageMode === "client" ? desktopRows.length : totalCap;
  const filteredRowCount = Math.min(sortedRows.length, maxRows);
  const desktopVisibilityClass =
    desktopBreakpoint === "xl" ? "xl:block" : desktopBreakpoint === "lg" ? "lg:block" : "md:block";
  const mobileVisibilityClass =
    desktopBreakpoint === "xl" ? "xl:hidden" : desktopBreakpoint === "lg" ? "lg:hidden" : "md:hidden";

  useEffect(() => {
    const el = desktopScrollRef.current;
    if (!el) return;

    updateDesktopScrollState();

    const handleScroll = () => updateDesktopScrollState();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateDesktopScrollState, tableMinWidthPx, desktopRows.length, filteredRowCount, pageIndex, pageSize]);

  return (
    <div className={["flex h-full min-w-0 flex-col", className].filter(Boolean).join(" ")}>
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          {title && (
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
          )}
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Showing {visibleRowCount} of {filteredRowCount} rows
            {sortedRows.length !== rows.length && (
              <span className="ml-2 text-slate-400 dark:text-slate-500">
                (filtered from {rows.length})
              </span>
            )}
          </span>
        </div>
       {/* Toolbar row */}
        <div className="w-full flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          {/* Left: paging controls (desktop only) */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            {pageMode === "client" && (
              <div className="min-w-[180px]">
                <SingleSelectFilter
                  label="Page size"
                  options={pageSizeOptions.map((n) => ({ value: n, label: String(n) }))}
                  value={pageSize}
                  onChange={(v) => {
                    if (v === "all") return;
                    setPageSize(v);
                    setPageIndex(0);
                  }}
                  includeAll={false}
                  allLabel="All"
                  placeholder="Page size..."
                />
              </div>
            )}
          </div>

          {/* Right: search + clear */}
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-end md:justify-end">
            {/* keeps a consistent "label height" like SingleSelectFilter */}
            <div className="flex w-full flex-col md:w-auto">
              <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-transparent select-none">
                .
              </span>

              {enableSearch && (
                <div className="w-full md:w-[280px]">
                  <RoundedInput
                    value={query}
                    placeholder={searchPlaceholder}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <RoundedButton
                size="xs"
                tone="ghost"
                color="rose"
                onClick={clearAll}
                className="md:mb-[2px]"
              >
                Clear
              </RoundedButton>
            )}
          </div>
        </div>

        {/* Mobile sort controls */}
        {sortableCols.length > 0 && (
          <div className="flex w-full items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 md:hidden">
            <div className="flex items-center gap-2">
              <span>Sort by</span>
             <SingleSelectFilter
                label="" // optional "Sort by"
                value={sortId}
                includeAll={false}
                onChange={(v) => setSortId(v)}
                options={sortableCols.map((c) => ({ value: c.id, label: c.label }))}
                allLabel={undefined as any} // only if your component forces "All" (see note below)
                placeholder="Sort by..."
              />
            </div>
            <RoundedButton
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
              {sortDir === "asc" ? "Asc" : "Desc"}

            </RoundedButton>
            {/* <button
              type="button"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
            </button> */}
          </div>
        )}
      </div>

      {/* Desktop table */}
        <div
          className={[
              "relative hidden min-w-0 isolate rounded-xl overflow-hidden border border-slate-200 bg-white/60 text-xs dark:border-slate-800 dark:bg-slate-900/40",
              desktopVisibilityClass,
          minHeightClassName, // keeps min size even with 1 row
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-none absolute inset-y-0 left-0 z-30 w-6 bg-gradient-to-r from-white/96 via-white/82 to-transparent transition-opacity duration-200 dark:from-slate-950/96 dark:via-slate-950/78",
            desktopScrollState.canScrollLeft ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <div
          className={[
            "pointer-events-none absolute inset-y-0 right-0 z-30 w-8 bg-gradient-to-l from-white/96 via-white/82 to-transparent transition-opacity duration-200 dark:from-slate-950/96 dark:via-slate-950/78",
            desktopScrollState.canScrollRight ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <div
          className={[
            "pointer-events-none absolute inset-x-0 top-0 z-30 h-5 bg-gradient-to-b from-slate-950/10 to-transparent transition-opacity duration-200 dark:from-black/35",
            desktopScrollState.canScrollDown ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <div
          ref={desktopScrollRef}
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarGutter: desktopScrollState.hasVerticalOverflow ? "stable" : "auto",
          }}
          className={[
            "h-full overflow-auto overscroll-contain scrollbar-dashboard",
            maxHeightClassName,
          ].join(" ")}
        >
          <div
            className={[
              "transition-opacity duration-500 ease-in-out",
              fadeIn ? "opacity-100" : "opacity-0",
              isPending ? "opacity-70" : "",
            ].join(" ")}
          >
            <table
              className="min-w-full table-fixed border-collapse"
              // style={{ minWidth: `${tableMinWidthPx}px` }}
            >
              <colgroup>
                {columns.map((c) => (
                  <col
                    key={c.id}
                    style={{
                      width: colWidths[c.id] ?? c.width ?? undefined,
                    }}
                  />
                ))}
              </colgroup>

              <thead className="text-slate-600 dark:text-slate-100">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.id}
                      className={[
                        "relative sticky top-0 z-20 border-b border-slate-200/80 px-3 py-2 text-left backdrop-blur dark:border-slate-800/90",
                        "bg-slate-50/95 dark:bg-slate-900/95",
                        isTailwindWidthClass(col.widthClass) ? col.widthClass : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                        <div className="min-w-0 overflow-hidden">
                          {col.sortValue ? (
                            <button
                              type="button"
                              onClick={() => toggleSort(col.id)}
                              className="inline-flex max-w-full items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                              title={col.label}
                            >
                              <span className="min-w-0 flex-1 truncate">{col.label}</span>

                              {indicator(col.id) && (
                                <span className="shrink-0 text-[9px] leading-none text-slate-400 dark:text-slate-500">
                                  {indicator(col.id)}
                                </span>
                              )}
                            </button>
                          ) : (
                            <span
                              className="block max-w-full truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300"
                              title={col.label}
                            >
                              {col.label}
                            </span>
                          )}
                        </div>
                        {(col.resizable ?? true) && (
                          <div
                            className="st-header-resize-handle-container absolute right-0 top-0 z-20 h-full w-3 cursor-col-resize"
                            role="separator"
                            aria-label={`Resize ${col.label} column`}
                            aria-orientation="vertical"
                            onMouseDown={startResize(col.id)}
                          >
                            <div className="st-header-resize-handle mx-auto h-full w-px" />
                          </div>
                        )}
                        <div className="flex shrink-0 items-center justify-end gap-1">
                          {col.filterKind && col.filterValue && (
                            <>
                              {(colFilters[col.id]?.length ?? 0) > 0 && (
                                <span className="rounded-full bg-slate-100 px-1.5 py-[1px] text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                  {colFilters[col.id].length}
                                </span>
                              )}

                              <ColumnFilterPopover
                                colId={col.id}
                                label={col.label}
                                kind={col.filterKind}
                                options={facets[col.id] ?? []}
                                selected={colFilters[col.id] ?? []}
                                facetQuery={facetQueryByCol[col.id] ?? ""}
                                setFacetQuery={(v) => setFacetQueryByCol((p) => ({ ...p, [col.id]: v }))}
                                open={openFilterColId === col.id}
                                setOpen={(v) => setOpenFilterColId(v ? col.id : null)}
                                onChangeSelected={(next) =>
                                  startTransition(() => {
                                    setColFilters((p) => ({ ...p, [col.id]: next }));
                                  })
                                }
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-slate-900/40">
                {desktopRows.map((row, idx) => (
                  <tr
                    key={getRowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={[
                      "transition-colors border-t border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-100",
                      idx % 2 === 0 ? "bg-slate-50/40 dark:bg-slate-900/30" : "bg-white/80 dark:bg-slate-900/40",
                      onRowClick ? "cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/40" : "",
                      rowClassName?.(row) ?? "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={[
                          "px-3 py-2 align-middle",
                          // optional: if you used width classes on td too, keep them here:
                          isTailwindWidthClass(col.widthClass) ? col.widthClass : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className={resolveCellClassName(col, row)} title={col.cellTitle?.(row)}>
                          {col.cell(row)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}

                {desktopRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-3 py-6 text-center text-[11px] text-slate-400 dark:text-slate-500"
                    >
                      {emptyText}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Mobile cards */}
      {renderMobileCard && (
        <div className={["space-y-2 text-xs", mobileVisibilityClass].join(" ")}
          style={{ WebkitOverflowScrolling: "touch" }}

        >
          {mobileRows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-center text-[11px] text-slate-400 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-500 pr-3 [scrollbar-gutter:stable]">
              {emptyText}
            </div>
          ) : (
            mobileRows.map((row) => (
              <React.Fragment key={getRowKey(row)}>
                {renderMobileCard(row)}
              </React.Fragment>
            ))
          )}
        </div>
      )}

      {/* Load more (mobile only) */}
      {renderMobileCard && canShowMoreMobile && (
        <div className={["mt-3 flex justify-center", mobileVisibilityClass].join(" ")}>
          <button
            type="button"
            onClick={() => setVisibleCount((p) => p + pageStep)}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
          >
            Show more
          </button>
        </div>
      )}
        {pageMode === "client" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Page {pageIndex + 1} / {totalPages}
            </span>

            <RoundedButton
              size="sm"
              tone="ghost"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            >
              Prev
            </RoundedButton>

            <RoundedButton
              size="sm"
              tone="ghost"
              disabled={pageIndex >= totalPages - 1}
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </RoundedButton>
          </div>
        )}
    </div>
  );
}

function useDebouncedValue<T>(value: T, delayMs = 180) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (typeof value === "string" && value === "") {
      setDebounced(value);
      return;
    }

    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

function asCssWidth(widthClass?: string): string | undefined {
  if (!widthClass) return undefined;

  // treat values like "16%", "140px", "12rem", "10vw", etc as CSS width
  const v = widthClass.trim();
  if (
    v.endsWith("%") ||
    v.endsWith("px") ||
    v.endsWith("rem") ||
    v.endsWith("em") ||
    v.endsWith("ch") ||
    v.endsWith("vw") ||
    v.endsWith("vh")
  ) {
    return v;
  }

  return undefined;
}

function isTailwindWidthClass(widthClass?: string) {
  if (!widthClass) return false;
  // keep it simple: if it's not a css width, treat as class string
  return !asCssWidth(widthClass);
}
