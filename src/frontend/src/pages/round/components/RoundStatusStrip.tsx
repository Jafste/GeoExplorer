import { Clock3 } from "lucide-react";
import { formatSeconds } from "../utils/roundFormat";

interface RoundStatusStripProps {
  remainingSeconds: number | null;
  roundNumber: number;
  timed: boolean;
  totalRounds: number;
}

export function RoundStatusStrip({
  remainingSeconds,
  roundNumber,
  timed,
  totalRounds,
}: RoundStatusStripProps) {
  return (
    <div className="round-floating-strip">
      <span className="chip chip-soft">Ronda {roundNumber}/{totalRounds}</span>
      <span className={`chip ${timed ? "chip-highlight" : "chip-soft"}`}>
        <Clock3 size={14} strokeWidth={2.1} />
        {timed ? formatSeconds(remainingSeconds ?? 0) : "Livre"}
      </span>
      <span className="chip chip-soft">Europa</span>
    </div>
  );
}
