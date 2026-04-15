import { startTransition, useEffect, useMemo, useState } from "react";
import { appConfig, defaultSessionConfig } from "./app/config";
import { AppTopbar } from "./components/AppTopbar";
import { TutorialOverlay } from "./components/TutorialOverlay";
import { RoundResultPage } from "./pages/round-result/RoundResultPage";
import { RoundPage } from "./pages/round/RoundPage";
import { SessionResultPage } from "./pages/session-result/SessionResultPage";
import { SetupPage } from "./pages/setup/SetupPage";
import { StartPage } from "./pages/start/StartPage";
import { createGameDataSource } from "./services/dataSource";
import type {
  ChallengeRound,
  RoundResolutionResponse,
  SessionConfig,
  SessionResult,
} from "./types/game";

type Phase = "landing" | "setup" | "round" | "round-result" | "session-result";
const TUTORIAL_STORAGE_KEY = "geoexplorer.tutorial.completed";

export default function App() {
  const dataSource = useMemo(
    () => createGameDataSource(appConfig.dataMode, appConfig.apiBaseUrl),
    []
  );

  const [phase, setPhase] = useState<Phase>("landing");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SessionConfig>(defaultSessionConfig);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<ChallengeRound | null>(null);
  const [roundResolution, setRoundResolution] = useState<RoundResolutionResponse | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  useEffect(() => {
    const completed = window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    setTutorialCompleted(completed);
    setTutorialOpen(!completed);
  }, []);

  const resetToHome = () => {
    setError(null);
    setBusy(false);
    setSessionId(null);
    setCurrentRound(null);
    setRoundResolution(null);
    setSessionResult(null);
    startTransition(() => {
      setPhase("landing");
    });
  };

  const beginSession = async (nextConfig: SessionConfig) => {
    setBusy(true);
    setError(null);

    try {
      const created = await dataSource.createSession(nextConfig);
      setConfig(nextConfig);
      setSessionId(created.sessionId);
      setCurrentRound(created.currentRound);
      setRoundResolution(null);
      setSessionResult(null);
      startTransition(() => {
        setPhase("round");
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel iniciar a sessao.");
    } finally {
      setBusy(false);
    }
  };

  const resolveRound = async (
    resolver: () => Promise<RoundResolutionResponse>
  ) => {
    setBusy(true);
    setError(null);

    try {
      const resolution = await resolver();
      setRoundResolution(resolution);
      startTransition(() => {
        setPhase("round-result");
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel resolver a ronda.");
    } finally {
      setBusy(false);
    }
  };

  const continueFlow = async () => {
    if (!sessionId || !roundResolution) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (roundResolution.progress.completed) {
        const results = await dataSource.getSessionResults(sessionId);
        setSessionResult(results);
        startTransition(() => {
          setPhase("session-result");
        });
      } else {
        const nextRound = await dataSource.getCurrentRound(sessionId);
        setCurrentRound(nextRound);
        startTransition(() => {
          setPhase("round");
        });
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Nao foi possivel continuar a sessao."
      );
    } finally {
      setBusy(false);
    }
  };

  const openTutorial = () => {
    setTutorialOpen(true);
  };

  const dismissTutorial = () => {
    setTutorialOpen(false);
    if (!tutorialCompleted) {
      setTutorialCompleted(true);
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    }
  };

  const goToSetup = () => {
    startTransition(() => {
      setPhase("setup");
    });
  };

  const shellClassName = phase === "round" ? "app-shell app-shell--play" : "app-shell";

  return (
    <main className={shellClassName}>
      <AppTopbar
        config={config}
        onHome={resetToHome}
        onOpenTutorial={openTutorial}
        onStart={goToSetup}
        phase={phase}
      />

      {error ? <div className="alert-banner">{error}</div> : null}

      {phase === "landing" ? (
        <StartPage onOpenTutorial={openTutorial} onStart={goToSetup} />
      ) : null}

      {phase === "setup" ? (
        <SetupPage
          busy={busy}
          initialConfig={config}
          onBack={resetToHome}
          onOpenTutorial={openTutorial}
          onSubmit={(nextConfig) => {
            void beginSession(nextConfig);
          }}
        />
      ) : null}

      {phase === "round" && currentRound && sessionId ? (
        <RoundPage
          busy={busy}
          round={currentRound}
          onSubmit={async (guess) => {
            await resolveRound(() => dataSource.submitGuess(sessionId, currentRound.id, guess));
          }}
          onTimeout={async (guess) => {
            await resolveRound(() => dataSource.timeoutRound(sessionId, currentRound.id, guess));
          }}
        />
      ) : null}

      {phase === "round-result" && roundResolution ? (
        <RoundResultPage
          busy={busy}
          progress={roundResolution.progress}
          result={roundResolution.result}
          onContinue={() => {
            void continueFlow();
          }}
          onHome={resetToHome}
        />
      ) : null}

      {phase === "session-result" && sessionResult ? (
        <SessionResultPage
          busy={busy}
          config={config}
          result={sessionResult}
          onReplay={() => {
            void beginSession(config);
          }}
          onHome={resetToHome}
        />
      ) : null}

      {tutorialOpen ? <TutorialOverlay onDismiss={dismissTutorial} /> : null}
    </main>
  );
}
