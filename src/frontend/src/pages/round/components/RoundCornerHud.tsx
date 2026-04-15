import { Clock3, Crosshair } from "lucide-react";

interface RoundCornerHudProps {
  timed: boolean;
}

export function RoundCornerHud({ timed }: RoundCornerHudProps) {
  return (
    <div className="round-corner-hud">
      <div className="round-corner-hud-item">
        <Crosshair size={15} strokeWidth={2.1} />
        <span>One pin only</span>
      </div>
      <div className="round-corner-hud-item">
        <Clock3 size={15} strokeWidth={2.1} />
        <span>{timed ? "Timer active" : "No timer"}</span>
      </div>
    </div>
  );
}
