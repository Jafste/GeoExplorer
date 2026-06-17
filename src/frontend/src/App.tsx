import { startTransition, Suspense, useEffect, useRef, useState } from "react";
import {
  buildRestorableViewUrl,
  getAnalysisPhase,
  getInitialRouteState,
  type RestorableSurfacePhase,
  type SurfacePhase,
} from "./app/navigation";
import { appConfig, defaultSessionConfig } from "./app/config";
import {
  getOperationLoadingTitle,
  getPhaseLoadingTitle,
  MultiplayerPage,
  prefetchPhaseModules,
  RoundPage,
  RoundResultPage,
  SessionResultPage,
  SetupPage,
  StartPage,
  TutorialOverlay,
} from "./app/pageModules";
import { createQuickSessionConfig } from "./app/quickSessionConfig";
import { preloadFirstAvailableRoundImage } from "./app/roundImagePreload";
import type { MultiplayerSidebarContext } from "./app/sidebarContext";
import { AppSidebar } from "./components/AppSidebar";
import { AppTopbar } from "./components/AppTopbar";
import { AppNotice } from "./components/ui/AppNotice";
import { ButtonBase } from "./components/ui/Button";
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
export default function App() {
  const [initialRoute] = useState(() => getInitialRouteState(window.location.search));
  const [dataSource, setDataSource] = useState<GameDataSource | null>(null);
  const [dataSourceError, setDataSourceError] = useState<string | null>(null);
  const [phase, setPhase] = useState<SurfacePhase>(initialRoute.phase);
  const [busy, setBusy] = useState(false);
  const [preparingDataSource, setPreparingDataSource] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SessionConfig>(defaultSessionConfig);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<ChallengeRound | null>(null);
  const [roundResolution, setRoundResolution] = useState<RoundResolutionResponse | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [multiplayerRoomCode, setMultiplayerRoomCode] = useState<string | null>(initialRoute.roomCode);
  const [multiplayerPlaying, setMultiplayerPlaying] = useState(false);
  const [multiplayerSidebarContext, setMultiplayerSidebarContext] =
    useState<MultiplayerSidebarContext | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dataSourceRef = useRef<GameDataSource | null>(null);
  const dataSourcePromiseRef = useRef<Promise<GameDataSource> | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ left: 0, top: 0, behavior: "auto" });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [phase]);

  useEffect(() => {
    const completed = window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    setTutorialCompleted(completed);
    setTutorialOpen(!completed);
  }, []);

  useEffect(() => {
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
  }, [phase]);

  const prepareDataSource = async () => {
    if (dataSourceRef.current) {
      return dataSourceRef.current;
    }

    if (!dataSourcePromiseRef.current) {
      setPreparingDataSource(true);
      dataSourcePromiseRef.current = createGameDataSource(appConfig.dataMode, appConfig.apiBaseUrl)
        .then((createdDataSource) => {
          dataSourceRef.current = createdDataSource;
          setDataSource(createdDataSource);
          setDataSourceError(null);
          return createdDataSource;
        })
        .catch((caughtError) => {
          dataSourcePromiseRef.current = null;
          setDataSourceError("Não foi possível preparar a fonte de dados do jogo.");
          throw caughtError;
        })
        .finally(() => {
          setPreparingDataSource(false);
        });
    }

    return dataSourcePromiseRef.current;
  };

  const writeRestorableView = (
    nextPhase: RestorableSurfacePhase,
    mode: "push" | "replace" = "push"
  ) => {
    const nextUrl = buildRestorableViewUrl(window.location.pathname, nextPhase);
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl === nextUrl) {
      return;
    }

    window.history[mode === "push" ? "pushState" : "replaceState"](null, "", nextUrl);
  };

  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (phase === "setup") {
      const nextUrl = buildRestorableViewUrl(window.location.pathname, "setup");

      if (currentUrl !== nextUrl) {
        window.history.replaceState(null, "", nextUrl);
      }

      return;
    }

    if (phase === "multiplayer" && !multiplayerRoomCode) {
      const nextUrl = buildRestorableViewUrl(window.location.pathname, "multiplayer");

      if (currentUrl !== nextUrl) {
        window.history.replaceState(null, "", nextUrl);
      }
    }
  }, [multiplayerRoomCode, phase]);

  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRouteState(window.location.search);

      setSidebarOpen(false);
      setError(null);
      setBusy(false);
      setMultiplayerPlaying(false);
      setMultiplayerSidebarContext(null);
      setMultiplayerRoomCode(route.roomCode);
      setSessionId(null);
      setCurrentRound(null);
      setRoundResolution(null);
      setSessionResult(null);

      startTransition(() => {
        setPhase(route.phase);
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const resetToHome = () => {
    setSidebarOpen(false);
    setError(null);
    setBusy(false);
    setSessionId(null);
    setMultiplayerRoomCode(null);
    setMultiplayerPlaying(false);
    setMultiplayerSidebarContext(null);
    setCurrentRound(null);
    setRoundResolution(null);
    setSessionResult(null);
    writeRestorableView("landing");
    startTransition(() => {
      setPhase("landing");
    });
  };

  const beginSession = async (nextConfig: SessionConfig) => {
    setBusy(true);
    setError(null);

    try {
      const activeDataSource = await prepareDataSource();
      const created = await activeDataSource.createSession(nextConfig);
      void preloadFirstAvailableRoundImage(created.currentRound);
      setConfig(nextConfig);
      setSessionId(created.sessionId);
      setCurrentRound(created.currentRound);
      setRoundResolution(null);
      setSessionResult(null);
      writeRestorableView("landing");
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
    if (!sessionId || !roundResolution) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const activeDataSource = await prepareDataSource();

      if (roundResolution.progress.completed) {
        const results = await activeDataSource.getSessionResults(sessionId);
        setSessionResult(results);
        startTransition(() => {
          setPhase("session-result");
        });
      } else {
        const nextRound = await activeDataSource.getCurrentRound(sessionId);
        void preloadFirstAvailableRoundImage(nextRound);
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
    setMultiplayerRoomCode(null);
    setMultiplayerPlaying(false);
    setMultiplayerSidebarContext(null);
    writeRestorableView("setup");
    startTransition(() => {
      setPhase("setup");
    });
  };

  const beginQuickSession = () => {
    setSidebarOpen(false);
    setMultiplayerRoomCode(null);
    setMultiplayerPlaying(false);
    setMultiplayerSidebarContext(null);
    void beginSession(createQuickSessionConfig());
  };

  const openMultiplayer = () => {
    setSidebarOpen(false);
    setMultiplayerRoomCode(null);
    setMultiplayerPlaying(false);
    setMultiplayerSidebarContext(null);
    setError(null);
    writeRestorableView("multiplayer");
    startTransition(() => {
      setPhase("multiplayer");
    });
  };

  const returnToMultiplayerMenu = () => {
    setSidebarOpen(false);
    setMultiplayerRoomCode(null);
    setMultiplayerPlaying(false);
    setMultiplayerSidebarContext(null);
    setError(null);
    writeRestorableView("multiplayer", "replace");
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

  const multiplayerImmersive = phase === "multiplayer" && multiplayerPlaying;
  const immersivePlay = phase === "round" || multiplayerImmersive;
  const showSidebar = !immersivePlay;
  const showTopbar = !multiplayerImmersive;
  const shellClassName =
    immersivePlay
      ? "app-shell app-shell--play"
      : `app-shell app-shell--hud app-shell--${phase}`;
  const stageClassName = `app-main-stage${showSidebar ? " app-main-stage--hud" : ""}${immersivePlay ? " app-main-stage--play" : ""}`;
  const phaseLoadingTitle = getPhaseLoadingTitle(phase);
  const operationLoadingTitle = getOperationLoadingTitle(phase, roundResolution);
  const busyTitle = preparingDataSource ? "A preparar dados do jogo" : operationLoadingTitle;
  const busyDetail = preparingDataSource
    ? "A carregar o catálogo necessário para sortear a missão."
    : "Estamos a sincronizar a próxima vista.";

  return (
    <main
      aria-busy={busy}
      className={shellClassName}
    >
      {showSidebar ? (
        <AppSidebar
          analysisEnabled={Boolean(roundResolution || sessionResult)}
          config={config}
          isOpen={sidebarOpen}
          multiplayerContext={multiplayerSidebarContext}
          onHome={resetToHome}
          onOpenMultiplayer={openMultiplayer}
          onOpenAnalysis={openAnalysis}
          onQuickStart={beginQuickSession}
          onStart={goToSetup}
          phase={phase}
          roundResolution={roundResolution}
          sessionResult={sessionResult}
        />
      ) : null}

      {showSidebar && sidebarOpen ? (
        <ButtonBase
          aria-label="Fechar menu"
          className="app-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className={stageClassName}>
        {showTopbar ? (
          <AppTopbar
            onHome={resetToHome}
            onOpenTutorial={openTutorial}
            onStart={goToSetup}
            onToggleSidebar={() => setSidebarOpen((current) => !current)}
            phase={phase}
            showSidebarToggle={showSidebar}
            sidebarOpen={sidebarOpen}
          />
        ) : null}

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
            detail={busyDetail}
            title={busyTitle}
          />
        ) : null}

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
                onStart={goToSetup}
              />
            ) : null}

            {phase === "multiplayer" ? (
              <MultiplayerPage
                initialRoomCode={multiplayerRoomCode}
                onExitRoom={returnToMultiplayerMenu}
                onPlayModeChange={setMultiplayerPlaying}
                onSidebarContextChange={setMultiplayerSidebarContext}
              />
            ) : null}

            {phase === "setup" ? (
              <SetupPage
                busy={busy}
                initialConfig={config}
                onSubmit={(nextConfig) => {
                  void beginSession(nextConfig);
                }}
              />
            ) : null}

            {phase === "round" && currentRound && sessionId && dataSource ? (
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
              />
            ) : null}
          </div>
        </Suspense>
      </div>

      {tutorialOpen ? (
        <Suspense fallback={null}>
          <TutorialOverlay onDismiss={dismissTutorial} />
        </Suspense>
      ) : null}
    </main>
  );
}
