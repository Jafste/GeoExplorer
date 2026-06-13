import { CircleHelp, Clock3, MoveHorizontal } from "lucide-react";
import type { InteractivePanoramaMode } from "../../../components/ChallengeSceneArt";
import { IconButton } from "../../../components/ui/Button";
import { formatSeconds } from "../utils/roundFormat";

interface RoundStatusStripProps {
  onOpenClues: () => void;
  panoramaMode: InteractivePanoramaMode | null;
  remainingSeconds: number | null;
  roundNumber: number;
  timed: boolean;
  totalRounds: number;
}

export function RoundStatusStrip({
  onOpenClues,
  panoramaMode,
  remainingSeconds,
  roundNumber,
  timed,
  totalRounds,
}: RoundStatusStripProps) {
  const panoramaTitle = panoramaMode === "360" ? "Vista 360 navegável" : "Panorama navegável";

  return (
    <div className="round-floating-strip">
      <span className="chip chip-soft">Ronda {roundNumber}/{totalRounds}</span>
      <span className={`chip ${timed ? "chip-highlight" : "chip-soft"}`}>
        <Clock3 size={14} strokeWidth={2.1} />
        {timed ? formatSeconds(remainingSeconds ?? 0) : "Livre"}
      </span>
      {panoramaMode ? (
        <span aria-label={panoramaTitle} className="chip chip-highlight round-panorama-chip" title={panoramaTitle}>
          <MoveHorizontal aria-hidden="true" size={14} strokeWidth={2.3} />
          {panoramaMode === "360" ? "360" : "Panorama"}
        </span>
      ) : null}
      <IconButton
        label="Ver briefing"
        className="chip chip-soft round-clue-trigger"
        onClick={onOpenClues}
      >
        <CircleHelp size={18} strokeWidth={2.2} />
      </IconButton>
    </div>
  );
}
