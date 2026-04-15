import type { ChallengeRound, GuessCoordinates } from "../../../types/game";
import { formatCategoryLabel } from "../utils/roundFormat";

interface RoundBriefingPanelProps {
  busy: boolean;
  guess: GuessCoordinates | null;
  onSubmit: (guess: GuessCoordinates) => Promise<void>;
  round: ChallengeRound;
}

export function RoundBriefingPanel({
  busy,
  guess,
  onSubmit,
  round,
}: RoundBriefingPanelProps) {
  return (
    <aside className="round-briefing-panel">
      <div className="round-briefing-head">
        <span className="muted-eyebrow">Live round</span>
        <h2>{round.challenge.title}</h2>
        <p>{round.challenge.prompt}</p>
      </div>

      <div className="round-briefing-meta">
        <div className="round-briefing-meta-item">
          <span className="muted-eyebrow">Target</span>
          <strong>{round.challenge.country}</strong>
          <span>{round.challenge.city}</span>
        </div>

        <div className="round-briefing-meta-item">
          <span className="muted-eyebrow">Profile</span>
          <strong>{formatCategoryLabel(round.challenge.category)}</strong>
          <span>{round.timed ? "Timed round" : "Free round"}</span>
        </div>
      </div>

      <div className="round-briefing-clues">
        {round.challenge.clues.map((clue) => (
          <div className="round-briefing-clue" key={clue.label}>
            <div>
              <span className="muted-eyebrow">{clue.label}</span>
              <strong>{clue.value}</strong>
            </div>
            <span className="round-briefing-confidence">{clue.confidence}</span>
          </div>
        ))}
      </div>

      <div className="round-pin-panel">
        <div>
          <span className="muted-eyebrow">Current pin</span>
          <strong>{guess ? guess.label : "Not placed yet"}</strong>
          <p>
            {guess
              ? `${guess.latitude.toFixed(2)} / ${guess.longitude.toFixed(2)}`
              : "Open the minimap and drop one pin on Europe."}
          </p>
        </div>

        <button
          className="button button-primary round-play-submit"
          disabled={!guess || busy}
          onClick={() => {
            if (guess) {
              void onSubmit(guess);
            }
          }}
          type="button"
        >
          {busy ? "Resolving..." : "Submit guess"}
        </button>
      </div>
    </aside>
  );
}
