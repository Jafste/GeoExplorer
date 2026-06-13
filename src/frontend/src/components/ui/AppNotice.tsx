import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { IconButton } from "./Button";

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
  info: "Estado do jogo",
  success: "Concluído",
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
        <IconButton
          className="app-notice-dismiss"
          label="Fechar aviso"
          onClick={onDismiss}
        >
          <X aria-hidden="true" size={16} strokeWidth={2.2} />
        </IconButton>
      ) : null}
    </div>
  );
}
