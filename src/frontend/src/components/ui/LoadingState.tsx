import { LoaderCircle, RadioTower } from "lucide-react";

interface LoadingStateProps {
  compact?: boolean;
  detail?: string;
  title: string;
}

export function LoadingState({ compact = false, detail, title }: LoadingStateProps) {
  return (
    <div
      className={`loading-state${compact ? " loading-state--compact" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="loading-state-icon" aria-hidden="true">
        {compact ? <LoaderCircle size={18} /> : <RadioTower size={22} />}
      </span>

      <div>
        <strong>{title}</strong>
        {detail ? <p>{detail}</p> : null}
      </div>
    </div>
  );
}
