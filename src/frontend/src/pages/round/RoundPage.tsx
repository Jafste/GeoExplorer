import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ChallengeSceneArt } from "../../components/ChallengeSceneArt";
import type { ChallengeRound, GuessCoordinates } from "../../types/game";
import { RoundBriefingPanel } from "./components/RoundBriefingPanel";
import { RoundCornerHud } from "./components/RoundCornerHud";
import { RoundMinimapDock } from "./components/RoundMinimapDock";
import { RoundStatusStrip } from "./components/RoundStatusStrip";

interface RoundPageProps {
  busy: boolean;
  round: ChallengeRound;
  onSubmit: (guess: GuessCoordinates) => Promise<void>;
  onTimeout: (guess: GuessCoordinates | null) => Promise<void>;
}

export function RoundPage({ busy, round, onSubmit, onTimeout }: RoundPageProps) {
  const [guess, setGuess] = useState<GuessCoordinates | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(round.timeLimitSeconds);
  const [mapHovered, setMapHovered] = useState(false);
  const [mapPinnedOpen, setMapPinnedOpen] = useState(false);
  const timeoutTriggeredRef = useRef(false);

  useEffect(() => {
    setGuess(null);
    setRemainingSeconds(round.timeLimitSeconds);
    setMapHovered(false);
    setMapPinnedOpen(false);
    timeoutTriggeredRef.current = false;
  }, [round.id, round.timeLimitSeconds]);

  const handleTimeout = useEffectEvent(async () => {
    if (timeoutTriggeredRef.current || busy) {
      return;
    }

    timeoutTriggeredRef.current = true;
    await onTimeout(guess);
  });

  useEffect(() => {
    if (!round.timed || round.timeLimitSeconds === null || busy) {
      return;
    }

    const timerId = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null) {
          return current;
        }

        if (current <= 1) {
          window.clearInterval(timerId);
          void handleTimeout();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [busy, handleTimeout, round.id, round.timeLimitSeconds, round.timed]);

  return (
    <section className="round-play-shell">
      <div className="round-play-canvas">
        <div className="round-canvas-scene">
          <ChallengeSceneArt challenge={round.challenge} />
          <div className="round-canvas-vignette" />
          <div className="round-canvas-grain" />
          <div className="round-canvas-scanline" />

          <RoundStatusStrip
            remainingSeconds={remainingSeconds}
            roundNumber={round.roundNumber}
            timed={round.timed}
            totalRounds={round.totalRounds}
          />

          <div className="round-scene-callout">
            <span className="muted-eyebrow">Scene read</span>
            <strong>{round.challenge.sceneLabel}</strong>
            <p>{round.challenge.sceneNote}</p>
          </div>

          <RoundBriefingPanel
            busy={busy}
            guess={guess}
            onSubmit={onSubmit}
            round={round}
          />

          <div aria-hidden="true" className="round-navigation-hint">
            <span className="round-navigation-arrow round-navigation-arrow-up" />
            <span className="round-navigation-arrow round-navigation-arrow-down" />
          </div>

          <RoundMinimapDock
            busy={busy}
            guess={guess}
            mapHovered={mapHovered}
            mapPinnedOpen={mapPinnedOpen}
            onGuessChange={(nextGuess) => {
              setGuess(nextGuess);
              setMapPinnedOpen(true);
            }}
            onMouseEnter={() => {
              setMapHovered(true);
            }}
            onMouseLeave={() => {
              setMapHovered(false);
            }}
            onTogglePinnedOpen={() => {
              setMapPinnedOpen((current) => !current);
            }}
            timed={round.timed}
          />

          <RoundCornerHud timed={round.timed} />
        </div>
      </div>
    </section>
  );
}
