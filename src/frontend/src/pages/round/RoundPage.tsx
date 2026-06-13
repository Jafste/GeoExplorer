import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ChallengeSceneArt,
  getInteractivePanoramaMode,
  type InteractivePanoramaMode,
} from "../../components/ChallengeSceneArt";
import { ModalDialog } from "../../components/ui/ModalDialog";
import type { ChallengeRound, GuessCoordinates } from "../../types/game";
import { RoundCornerHud } from "./components/RoundCornerHud";
import { RoundMinimapDock } from "./components/RoundMinimapDock";
import { RoundStatusStrip } from "./components/RoundStatusStrip";
import { RoundTelemetryFooter } from "./components/RoundTelemetryFooter";
import { formatCategoryLabel } from "./utils/roundFormat";

interface RoundPageProps {
  busy: boolean;
  round: ChallengeRound;
  onSubmit: (guess: GuessCoordinates) => Promise<void>;
  onTimeout: (guess: GuessCoordinates | null) => Promise<void>;
}

export function RoundPage({ busy, round, onSubmit, onTimeout }: RoundPageProps) {
  const [guess, setGuess] = useState<GuessCoordinates | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(round.timeLimitSeconds);
  const [cluesOpen, setCluesOpen] = useState(false);
  const [mapHovered, setMapHovered] = useState(false);
  const [mapPinnedOpen, setMapPinnedOpen] = useState(false);
  const [panoramaMode, setPanoramaMode] = useState<InteractivePanoramaMode | null>(() =>
    getInteractivePanoramaMode(round.challenge.media)
  );
  const timeoutTriggeredRef = useRef(false);

  useEffect(() => {
    setGuess(null);
    setRemainingSeconds(round.timeLimitSeconds);
    setCluesOpen(false);
    setMapHovered(false);
    setMapPinnedOpen(false);
    setPanoramaMode(getInteractivePanoramaMode(round.challenge.media));
    timeoutTriggeredRef.current = false;
  }, [round.challenge.media, round.id, round.timeLimitSeconds]);

  const handleTimeout = useEffectEvent(async () => {
    if (timeoutTriggeredRef.current || busy) {
      return;
    }

    timeoutTriggeredRef.current = true;
    await onTimeout(guess);
  });

  const toggleMapPinnedOpen = () => {
    setMapHovered(false);
    setMapPinnedOpen((current) => !current);
  };

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
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [busy, handleTimeout, round.id, round.timeLimitSeconds, round.timed]);

  useEffect(() => {
    if (!round.timed || remainingSeconds !== 0 || busy) {
      return;
    }

    void handleTimeout();
  }, [busy, handleTimeout, remainingSeconds, round.timed]);

  return (
    <section className="round-play-shell">
      <div className="round-play-canvas">
        <div className="round-canvas-scene">
          <ChallengeSceneArt challenge={round.challenge} onPanoramaModeChange={setPanoramaMode} />
          <div className="round-canvas-vignette" />
          <div className="round-canvas-grain" />
          <div className="round-canvas-scanline" />

          <RoundStatusStrip
            onOpenClues={() => setCluesOpen(true)}
            panoramaMode={panoramaMode}
            remainingSeconds={remainingSeconds}
            roundNumber={round.roundNumber}
            timed={round.timed}
            totalRounds={round.totalRounds}
          />

          <div className="round-scene-callout">
            <span className="muted-eyebrow">Leitura do alvo</span>
            <strong>{round.challenge.sceneLabel}</strong>
            <p>{round.challenge.sceneNote}</p>
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
            onSubmit={onSubmit}
            onTogglePinnedOpen={toggleMapPinnedOpen}
            timed={round.timed}
          />

          <RoundCornerHud
            guess={guess}
            mapOpen={mapHovered || mapPinnedOpen}
            timed={round.timed}
          />

          <RoundTelemetryFooter
            guess={guess}
            mapOpen={mapHovered || mapPinnedOpen}
            remainingSeconds={remainingSeconds}
            round={round}
          />

          {cluesOpen ? (
            <ModalDialog title="Briefing da ronda" onClose={() => setCluesOpen(false)}>
              <div className="round-clue-modal-summary">
                <span className="muted-eyebrow">Alvo ativo</span>
                <strong>{round.challenge.title}</strong>
                <p>{round.challenge.prompt}</p>
                <div>
                  <span>{formatCategoryLabel(round.challenge.category)}</span>
                  <span>{round.timed ? "Cronómetro ativo" : "Sem cronómetro"}</span>
                </div>
              </div>
              <div className="multiplayer-clue-list">
                {round.challenge.clues.map((clue) => (
                  <div className="multiplayer-clue-item" key={clue.label}>
                    <div>
                      <span className="muted-eyebrow">{clue.label}</span>
                      <strong>{clue.value}</strong>
                    </div>
                    <span>{clue.confidence}</span>
                  </div>
                ))}
              </div>
            </ModalDialog>
          ) : null}
        </div>
      </div>
    </section>
  );
}
