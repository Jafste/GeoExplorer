import { lazy, startTransition, Suspense, useEffect, useState } from "react";
import { getAnalysisPhase, type SurfacePhase } from "./app/navigation";
import { appConfig, defaultSessionConfig } from "./app/config";
import { AppSidebar } from "./components/AppSidebar";
import { AppTopbar } from "./components/AppTopbar";
import { AppNotice } from "./components/ui/AppNotice";
import { LoadingState } from "./components/ui/LoadingState";
import { createGameDataSource } from "./services/dataSource";
import type {
  ChallengeRound,
  RoundResolutionResponse,
  SessionConfig,
  SessionResult,
  GameDataSource,
} from "./types/game";

const TUTORIAL_STORAGE_KEY = "geoexplorer.tutorial.completed";
const loadStartPage = () =>
  import("./pages/start/StartPage").then((module) => ({
    default: module.StartPage,
  }));
const loadSetupPage = () =>
  import("./pages/setup/SetupPage").then((module) => ({
    default: module.SetupPage,
  }));
const loadRoundPage = () =>
  import("./pages/round/RoundPage").then((module) => ({
    default: module.RoundPage,
  }));
const loadRoundResultPage = () =>
  import("./pages/round-result/RoundResultPage").then((module) => ({
    default: module.RoundResultPage,
  }));
const loadSessionResultPage = () =>
  import("./pages/session-result/SessionResultPage").then((module) => ({
    default: module.SessionResultPage,
  }));
const loadMultiplayerPage = () =>
  import("./pages/multiplayer/MultiplayerPage").then((module) => ({
    default: module.MultiplayerPage,
  }));
const loadTutorialOverlay = () =>
  import("./components/TutorialOverlay").then((module) => ({
    default: module.TutorialOverlay,
  }));

const StartPage = lazy(loadStartPage);
const SetupPage = lazy(loadSetupPage);
const RoundPage = lazy(loadRoundPage);
const RoundResultPage = lazy(loadRoundResultPage);
const SessionResultPage = lazy(loadSessionResultPage);
const MultiplayerPage = lazy(loadMultiplayerPage);
const TutorialOverlay = lazy(loadTutorialOverlay);

function prefetchPhaseModules(phase: SurfacePhase) {
  switch (phase) {
    case "landing":
      void loadSetupPage();
      void loadMultiplayerPage();
      void loadTutorialOverlay();
      break;
    case "setup":
      void loadRoundPage();
      void loadTutorialOverlay();
      break;
    case "round":
      void loadRoundResultPage();
      break;
    case "round-result":
      void loadRoundPage();
      void loadSessionResultPage();
      break;
    case "session-result":
      void loadSetupPage();
      void loadRoundPage();
      break;
    case "multiplayer":
      void loadTutorialOverlay();
      break;
  }
}

function getPhaseLoadingTitle(phase: SurfacePhase) {
  switch (phase) {
    case "landing":
      return "A preparar centro de missão";
    case "setup":
      return "A carregar configuração";
    case "round":
      return "A preparar ronda";
    case "round-result":
      return "A carregar relatório da ronda";
    case "session-result":
      return "A consolidar relatório final";
    case "multiplayer":
      return "A preparar sala multiplayer";
  }
}

function getOperationLoadingTitle(
  phase: SurfacePhase,
  roundResolution: RoundResolutionResponse | null
) {
  switch (phase) {
    case "setup":
      return "A lançar missão";
    case "round":
      return "A resolver palpite";
    case "round-result":
      return roundResolution?.progress.completed
        ? "A consolidar relatório final"
        : "A preparar próxima ronda";
    case "session-result":
      return "A reiniciar missão";
    default:
      return "A sincronizar dados";
  }
}

export default function App() {
  const [dataSource, setDataSource] = useState<GameDataSource | null>(null);
  const [dataSourceError, setDataSourceError] = useState<string | null>(null);
  const [phase, setPhase] = useState<SurfacePhase>("landing");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SessionConfig>(defaultSessionConfig);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<ChallengeRound | null>(null);
  const [roundResolution, setRoundResolution] = useState<RoundResolutionResponse | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [multiplayerRoomCode, setMultiplayerRoomCode] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void createGameDataSource(appConfig.dataMode, appConfig.apiBaseUrl)
      .then((createdDataSource) => {
        if (!cancelled) {
          setDataSource(createdDataSource);
          setDataSourceError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataSourceError("Não foi possível preparar a fonte de dados da missão.");
        }
      });

    const completed = window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    setTutorialCompleted(completed);
    setTutorialOpen(!completed);

    const roomCode = new URLSearchParams(window.location.search).get("room");
    if (roomCode) {
      setMultiplayerRoomCode(roomCode.toUpperCase());
      setPhase("multiplayer");
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dataSource) {
      return;
    }

    const useIdleCallback =
      "requestIdleCallback" in window && "cancelIdleCallback" in window;
    const scheduleId = useIdleCallback
      ? window.requestIdleCallback(() => prefetchPhaseModules(phase))
      : window.setTimeout(() => prefetchPhaseModules(phase), 250);

    return () => {
      if (useIdleCallback) {
        window.cancelIdleCallback(scheduleId);
      } else {
        window.clearTimeout(scheduleId);
      }
    };
  }, [dataSource, phase]);

  const resetToHome = () => {
    setSidebarOpen(false);
    setError(null);
    setBusy(false);
    setSessionId(null);
    setMultiplayerRoomCode(null);
    setCurrentRound(null);
    setRoundResolution(null);
    setSessionResult(null);
    window.history.replaceState(null, "", window.location.pathname);
    startTransition(() => {
      setPhase("landing");
    });
  };

  const beginSession = async (nextConfig: SessionConfig) => {
    if (!dataSource) {
      setError("A fonte de dados ainda está a arrancar. Tenta novamente dentro de instantes.");
      return;
    }

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
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível iniciar a sessão.");
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
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível resolver a ronda.");
    } finally {
      setBusy(false);
    }
  };

  const continueFlow = async () => {
    if (!dataSource || !sessionId || !roundResolution) {
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
        caughtError instanceof Error ? caughtError.message : "Não foi possível continuar a sessão."
      );
    } finally {
      setBusy(false);
    }
  };

  const openTutorial = () => {
    setSidebarOpen(false);
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
    setSidebarOpen(false);
    startTransition(() => {
      setPhase("setup");
    });
  };

  const openMultiplayer = () => {
    setSidebarOpen(false);
    setError(null);
    startTransition(() => {
      setPhase("multiplayer");
    });
  };

  const openAnalysis = () => {
    if (!roundResolution && !sessionResult) {
      return;
    }

    setSidebarOpen(false);
    setError(null);
    startTransition(() => {
      setPhase(
        getAnalysisPhase({
          roundResolution,
          sessionResult,
        })
      );
    });
  };

  const showSidebar = phase !== "round";
  const shellClassName =
    phase === "round"
      ? "app-shell app-shell--play"
      : `app-shell app-shell--hud app-shell--${phase}`;
  const stageClassName = `app-main-stage${showSidebar ? " app-main-stage--hud" : ""}${phase === "round" ? " app-main-stage--play" : ""}`;
  const phaseLoadingTitle = getPhaseLoadingTitle(phase);
  const operationLoadingTitle = getOperationLoadingTitle(phase, roundResolution);

  return (
    <main
      aria-busy={busy || (!dataSource && !dataSourceError)}
      className={shellClassName}
    >
      {showSidebar ? (
        <AppSidebar
          analysisEnabled={Boolean(roundResolution || sessionResult)}
          config={config}
          isOpen={sidebarOpen}
          onHome={resetToHome}
          onOpenAnalysis={openAnalysis}
          onOpenTutorial={openTutorial}
          onStart={goToSetup}
          phase={phase}
        />
      ) : null}

      {showSidebar && sidebarOpen ? (
        <button
          aria-label="Fechar menu"
          className="app-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <div className={stageClassName}>
        <AppTopbar
          config={config}
          onHome={resetToHome}
          onOpenTutorial={openTutorial}
          onStart={goToSetup}
          onToggleSidebar={() => setSidebarOpen((current) => !current)}
          phase={phase}
          showSidebarToggle={showSidebar}
          sidebarOpen={sidebarOpen}
        />

        {error ? (
          <AppNotice
            message={error}
            onDismiss={() => setError(null)}
            tone="danger"
          />
        ) : null}

        {dataSourceError ? (
          <AppNotice
            message={dataSourceError}
            onDismiss={() => setDataSourceError(null)}
            tone="danger"
          />
        ) : null}

        {busy ? (
          <LoadingState
            compact
            detail="Estamos a sincronizar a próxima vista."
            title={operationLoadingTitle}
          />
        ) : null}

        {!dataSource && !dataSourceError ? (
          <LoadingState
            detail="A ligar ao catálogo e preparar o modo de dados."
            title="A preparar dados da missão"
          />
        ) : dataSource ? (
          <Suspense
            fallback={
              <LoadingState
                detail="A carregar o módulo da interface."
                title={phaseLoadingTitle}
              />
            }
          >
            <div className={`view-transition view-transition--${phase}`} key={phase}>
              {phase === "landing" ? (
                <StartPage
                  onMultiplayer={openMultiplayer}
                  onOpenTutorial={openTutorial}
                  onStart={goToSetup}
                />
              ) : null}

              {phase === "multiplayer" ? (
                <MultiplayerPage
                  initialRoomCode={multiplayerRoomCode}
                  onBack={resetToHome}
                />
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
            </div>
          </Suspense>
        ) : null}
      </div>

      {tutorialOpen ? (
        <Suspense fallback={null}>
          <TutorialOverlay onDismiss={dismissTutorial} />
        </Suspense>
      ) : null}
    </main>
  );
}
