import React, { useEffect } from "react";
import { CardSlot } from "../layout/card/CardSlot";
import { RoundedButton } from "./roundedButton";

type DrawerMaxWidth = number | string | undefined;
const DRAWER_TRANSITION_MS = 240;

function resolveMaxWidth(v: DrawerMaxWidth): string | undefined {
  if (v == null) return undefined;

  // number => percent
  if (typeof v === "number") return `${v}%`;

  const s = String(v).trim();
  if (!s) return undefined;

  // "30" => percent
  if (/^\d+(\.\d+)?$/.test(s)) return `${s}%`;

  // already has units: %, px, rem, vw, etc.
  return s;
}

export type DrawerPanelProps = {
  open: boolean;
  onClose: () => void;

  title?: React.ReactNode;
  subtitle?: React.ReactNode;

  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showDefaultCloseButton?: boolean;

  /** Instead of widthClassName. Examples: 30, "30", "30%", "720px" */
  maxWidth?: number | string;

  contentClassName?: string;
  cardClassName?: string;

  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  lockBodyScroll?: boolean;

  initialFocusRef?: React.RefObject<HTMLElement>;
  initialFocusDelayMs?: number;
  drawerClassName?: string;
};

export const DrawerPanel: React.FC<DrawerPanelProps> = ({
  open,
  onClose,
  title,
  subtitle,
  headerActions,
  children,
  footer,
  showDefaultCloseButton = true,

  maxWidth = "520px", // default

  contentClassName,
  cardClassName,

  closeOnBackdrop = true,
  closeOnEsc = true,
  lockBodyScroll = true,

  initialFocusRef,
  initialFocusDelayMs = 50,
  drawerClassName,
}) => {
  const [shouldRender, setShouldRender] = React.useState(open);
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    let renderFrame = 0;
    let visibilityFrame = 0;

    if (open) {
      renderFrame = window.requestAnimationFrame(() => {
        setShouldRender(true);
        visibilityFrame = window.requestAnimationFrame(() => setIsVisible(true));
      });

      return () => {
        window.cancelAnimationFrame(renderFrame);
        window.cancelAnimationFrame(visibilityFrame);
      };
    }

    visibilityFrame = window.requestAnimationFrame(() => setIsVisible(false));

    if (!shouldRender) return;

    const timeout = window.setTimeout(() => {
      setShouldRender(false);
    }, DRAWER_TRANSITION_MS);

    return () => {
      window.cancelAnimationFrame(visibilityFrame);
      window.clearTimeout(timeout);
    };
  }, [open, shouldRender]);

  useEffect(() => {
    if (!shouldRender || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shouldRender, closeOnEsc, onClose]);

  useEffect(() => {
    if (!shouldRender || !lockBodyScroll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [shouldRender, lockBodyScroll]);

  useEffect(() => {
    if (!open) return;
    if (!initialFocusRef?.current) return;

    const t = window.setTimeout(() => {
      if (!open) return;
      initialFocusRef.current?.focus?.();
    }, initialFocusDelayMs);

    return () => window.clearTimeout(t);
  }, [open, initialFocusRef, initialFocusDelayMs]);

  if (!shouldRender) return null;

  const resolvedMaxWidth = resolveMaxWidth(maxWidth);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={[
          "absolute inset-0 bg-slate-950/45 transition-opacity duration-200 ease-out",
          isVisible ? "opacity-100 backdrop-blur-[2px]" : "opacity-0",
        ].join(" ")}
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />

      {/* Drawer */}
      <div
        className={[
          "absolute right-0 top-0 flex h-full w-full overflow-hidden border-l border-slate-200/70 bg-white shadow-2xl transition-all duration-300",
          "ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-slate-800/70 dark:bg-slate-950",
          isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0",
          drawerClassName,
        ].filter(Boolean).join(" ")}
        onClick={(e) => e.stopPropagation()}
        style={{
          WebkitOverflowScrolling: "touch",
          maxWidth: resolvedMaxWidth, 
        }}
      >
        <div
          className={[
            "flex h-full w-full flex-col p-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isVisible ? "translate-y-0" : "translate-y-3",
            contentClassName,
          ].filter(Boolean).join(" ")}
        >
          <CardSlot
            className="dashboard-glow h-full"
            contentClassName={["flex h-full flex-col space-y-4", cardClassName].filter(Boolean).join(" ")}
          >
            {(title || subtitle || headerActions) && (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {title && <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</div>}
                  {subtitle && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {subtitle}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {headerActions}
                  {!headerActions && showDefaultCloseButton && (
                    <RoundedButton size="xs" tone="soft" onClick={onClose}>
                      Close
                    </RoundedButton>
                  )}
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4" style={{ WebkitOverflowScrolling: "touch" }}>
              {children}
            </div>

            {footer && (
              <div className="mt-1 shrink-0 border-t border-slate-200/70 pt-3 dark:border-slate-800/80">
                {footer}
              </div>
            )}
          </CardSlot>
        </div>
      </div>
    </div>
  );
};
