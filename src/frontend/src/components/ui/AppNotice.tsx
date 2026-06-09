import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type AppNoticeTone = "danger" | "info" | "success";

interface AppNoticeProps {
  message: string;
  onDismiss?: () => void;
  title?: string;
  tone?: AppNoticeTone;
}

const NOTICE_ICON = {
  danger: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const NOTICE_TITLE: Record<AppNoticeTone, string> = {
  danger: "Ação interrompida",
  info: "Estado da missão",
  success: "Operação concluída",
};

export function AppNotice({
  message,
  onDismiss,
  title,
  tone = "info",
}: AppNoticeProps) {
  const Icon = NOTICE_ICON[tone];
  const role = tone === "danger" ? "alert" : "status";

  return (
    <div className={`app-notice app-notice--${tone}`} role={role}>
      <Icon aria-hidden="true" size={18} strokeWidth={2.2} />

      <div className="app-notice-copy">
        <strong>{title ?? NOTICE_TITLE[tone]}</strong>
        <p>{message}</p>
      </div>

      {onDismiss ? (
        <button
          aria-label="Fechar aviso"
          className="app-notice-dismiss"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden="true" size={16} strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
}
