import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./Button";

interface ModalDialogProps {
  children: ReactNode;
  title: string;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  onClose: () => void;
}

export function ModalDialog({
  children,
  title,
  footer,
  className,
  bodyClassName,
  onClose,
}: ModalDialogProps) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="modal-dialog-backdrop">
      <button
        aria-label="Fechar popup"
        className="modal-dialog-scrim"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={["modal-dialog", className].filter(Boolean).join(" ")}
        role="dialog"
      >
        <div className="modal-dialog-head">
          <h3 className="modal-dialog-title" id={titleId}>
            {title}
          </h3>
          <IconButton
            className="multiplayer-icon-button"
            label="Fechar popup"
            onClick={onClose}
            title="Fechar"
          >
            <X size={18} strokeWidth={2.2} />
          </IconButton>
        </div>
        <div className={["modal-dialog-body", bodyClassName].filter(Boolean).join(" ")}>
          {children}
        </div>
        {footer ? <div className="modal-dialog-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
