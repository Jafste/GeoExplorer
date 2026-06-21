import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ChallengeSceneArt,
  getInteractivePanoramaMode,
  type InteractivePanoramaMode,
} from "../../components/ChallengeSceneArt";
import { getRoundRemainingSeconds } from "../../app/roundTimer";
import { ModalDialog } from "../../components/ui/ModalDialog";
import type { ChallengeRound, GuessCoordinates } from "../../types/game";
import { RoundClueList } from "./components/RoundClueList";
import { RoundCornerHud } from "./components/RoundCornerHud";
import { RoundMinimapDock } from "./components/RoundMinimapDock";
import { RoundStatusStrip } from "./components/RoundStatusStrip";
import { RoundTelemetryFooter } from "./components/RoundTelemetryFooter";
import { formatCategoryLabel } from "./utils/roundFormat";

interface RoundPageProps {
  busy: boolean;
  round: ChallengeRound;
  roundEndsAt: string | null;
  showTotalScore: boolean;
  totalScore: number;
  onSubmit: (guess: GuessCoordinates) => Promise<void>;
  onTimeout: (guess: GuessCoordinates | null) => Promise<void>;
}

export function RoundPage({ busy, round, roundEndsAt, showTotalScore, totalScore, onSubmit, onTimeout }: RoundPageProps) {
  const [guess, setGuess] = useState<GuessCoordinates | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() =>
    getRoundRemainingSeconds({ ...round, endsAt: roundEndsAt })
  );
  const [cluesOpen, setCluesOpen] = useState(false);
  const [mapHovered, setMapHovered] = useState(false);
  const [mapMounted, setMapMounted] = useState(false);
  const [mapPinnedOpen, setMapPinnedOpen] = useState(false);
  const [panoramaMode, setPanoramaMode] = useState<InteractivePanoramaMode | null>(() =>
    getInteractivePanoramaMode(round.challenge.media)
  );
  const timeoutTriggeredRef = useRef(false);
  const mapOpen = mapHovered || mapPinnedOpen;

  useEffect(() => {
    setGuess(null);
    setRemainingSeconds(getRoundRemainingSeconds({ ...round, endsAt: roundEndsAt }));
    setCluesOpen(false);
    setMapHovered(false);
    setMapMounted(false);
    setMapPinnedOpen(false);
    setPanoramaMode(getInteractivePanoramaMode(round.challenge.media));
    timeoutTriggeredRef.current = false;
  }, [round.challenge.media, round.id, round.timeLimitSeconds, roundEndsAt]);

  const handleTimeout = useEffectEvent(async () => {
    if (timeoutTriggeredRef.current || busy) {
      return;
    }

    timeoutTriggeredRef.current = true;
    await onTimeout(guess);
  });

  const toggleMapPinnedOpen = () => {
    setMapHovered(false);
    setMapMounted(true);
    setMapPinnedOpen((current) => !current);
  };

  useEffect(() => {
    if (!round.timed || round.timeLimitSeconds === null || busy) {
      return;
    }

    const updateRemainingSeconds = () => {
      setRemainingSeconds(getRoundRemainingSeconds({ ...round, endsAt: roundEndsAt }));
    };
    updateRemainingSeconds();

    const timerId = window.setInterval(updateRemainingSeconds, 1000);
    window.addEventListener("focus", updateRemainingSeconds);
    document.addEventListener("visibilitychange", updateRemainingSeconds);

    return () => {
      window.clearInterval(timerId);
      window.removeEventListener("focus", updateRemainingSeconds);
      document.removeEventListener("visibilitychange", updateRemainingSeconds);
    };
  }, [busy, round, roundEndsAt]);

  useEffect(() => {
    if (!round.timed || remainingSeconds !== 0 || busy) {
      return;
    }

    void handleTimeout();
  }, [busy, handleTimeout, remainingSeconds, round.timed]);

  return (
    <section className="round-play-shell">
      <div className="round-play-canvas">
        <div className={`round-canvas-scene${mapOpen ? " is-map-open" : ""}`}>
          <ChallengeSceneArt challenge={round.challenge} onPanoramaModeChange={setPanoramaMode} />
          <div className="round-canvas-vignette" />
          <div className="round-canvas-grain" />
          <div className="round-canvas-scanline" />

          <RoundStatusStrip
            onOpenClues={() => setCluesOpen(true)}
            panoramaMode={panoramaMode}
            remainingSeconds={remainingSeconds}
            roundNumber={round.roundNumber}
            showTotalScore={showTotalScore}
            timed={round.timed}
            totalScore={totalScore}
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
            key={round.id}
            mapHovered={mapHovered}
            mapMounted={mapMounted}
            mapPinnedOpen={mapPinnedOpen}
            onGuessChange={(nextGuess) => {
              setGuess(nextGuess);
              setMapMounted(true);
              setMapPinnedOpen(true);
            }}
            onMouseEnter={() => {
              setMapHovered(true);
              setMapMounted(true);
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
            mapOpen={mapOpen}
            timed={round.timed}
          />

          <RoundTelemetryFooter
            guess={guess}
            mapOpen={mapOpen}
            remainingSeconds={remainingSeconds}
            round={round}
          />

          {cluesOpen ? (
            <ModalDialog title="Briefing da ronda" onClose={() => setCluesOpen(false)}>
              <div className="round-clue-modal-summary">
                <span className="muted-eyebrow">Leitura do alvo</span>
                <strong>{round.challenge.sceneLabel}</strong>
                <p>{round.challenge.sceneNote}</p>
                <div>
                  <span>{formatCategoryLabel(round.challenge.category)}</span>
                  <span>{round.timed ? "Cronómetro ativo" : "Sem cronómetro"}</span>
                </div>
              </div>
              <div className="multiplayer-clue-list">
                <RoundClueList clues={round.challenge.clues} />
              </div>
            </ModalDialog>
          ) : null}
        </div>
      </div>
    </section>
  );
}
