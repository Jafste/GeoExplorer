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
import { createRoundEndsAt } from "./app/roundTimer";
import { preloadFirstAvailableRoundImage } from "./app/roundImagePreload";
import type { MultiplayerSidebarContext } from "./app/sidebarContext";
import {
  clearSoloSessionResume,
  readSoloSessionResume,
  saveSoloSessionResume,
} from "./app/soloSessionResume";
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
const SHOW_TOTAL_SCORE_STORAGE_KEY = "geoexplorer.showTotalScoreDuringRound";
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
  const [currentSessionScore, setCurrentSessionScore] = useState(0);
  const [currentRoundEndsAt, setCurrentRoundEndsAt] = useState<string | null>(null);
  const [showTotalScoreDuringRound, setShowTotalScoreDuringRound] = useState(
    () => window.localStorage.getItem(SHOW_TOTAL_SCORE_STORAGE_KEY) === "true"
  );
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
  const soloResumeRestoreAttemptedRef = useRef(false);

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

  useEffect(() => {
    if (soloResumeRestoreAttemptedRef.current || initialRoute.phase !== "landing") {
      return;
    }

    const resume = readSoloSessionResume(window.localStorage);
    if (!resume) {
      return;
    }

    let cancelled = false;
    soloResumeRestoreAttemptedRef.current = true;
    setBusy(true);
    setError(null);

    void prepareDataSource()
      .then(async (activeDataSource) => {
        if (cancelled) {
          return;
        }

        setConfig(resume.config);
        setSessionId(resume.sessionId);
        setCurrentSessionScore(resume.currentSessionScore);
        setRoundResolution(resume.roundResolution);
        setSessionResult(resume.sessionResult);

        if (resume.phase === "session-result" && resume.sessionResult) {
          startTransition(() => {
            setPhase("session-result");
          });
          return;
        }

        if (resume.phase === "round-result" && resume.roundResolution) {
          startTransition(() => {
            setPhase("round-result");
          });
          return;
        }

        try {
          const restoredRound = await activeDataSource.getCurrentRound(resume.sessionId);
          const restoredEndsAt =
            resume.currentRoundId === restoredRound.id
              ? resume.roundEndsAt
              : createRoundEndsAt(restoredRound);

          setCurrentRound(restoredRound);
          setCurrentRoundEndsAt(restoredEndsAt);
          saveSoloSessionResume(window.localStorage, {
            ...resume,
            currentRoundId: restoredRound.id,
            phase: "round",
            roundEndsAt: restoredEndsAt,
            roundResolution: null,
            sessionResult: null,
          });
          void preloadFirstAvailableRoundImage(restoredRound);
          startTransition(() => {
            setPhase("round");
          });
        } catch {
          const results = await activeDataSource.getSessionResults(resume.sessionId);
          setCurrentSessionScore(results.totalScore);
          setSessionResult(results);
          saveSoloSessionResume(window.localStorage, {
            ...resume,
            currentRoundId: null,
            currentSessionScore: results.totalScore,
            phase: "session-result",
            roundEndsAt: null,
            roundResolution: null,
            sessionResult: results,
          });
          startTransition(() => {
            setPhase("session-result");
          });
        }
      })
      .catch(() => {
        clearSoloSessionResume(window.localStorage);
        setError("Não foi possível recuperar a sessão solo.");
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialRoute.phase]);

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
      setCurrentSessionScore(0);
      setCurrentRoundEndsAt(null);
      setCurrentRound(null);
      setRoundResolution(null);
      setSessionResult(null);
      clearSoloSessionResume(window.localStorage);

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
    setCurrentSessionScore(0);
    setCurrentRoundEndsAt(null);
    setMultiplayerRoomCode(null);
    setMultiplayerPlaying(false);
    setMultiplayerSidebarContext(null);
    setCurrentRound(null);
    setRoundResolution(null);
    setSessionResult(null);
    clearSoloSessionResume(window.localStorage);
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
      const roundEndsAt = createRoundEndsAt(created.currentRound);
      void preloadFirstAvailableRoundImage(created.currentRound);
      setConfig(nextConfig);
      setSessionId(created.sessionId);
      setCurrentSessionScore(0);
      setCurrentRoundEndsAt(roundEndsAt);
      setCurrentRound(created.currentRound);
      setRoundResolution(null);
      setSessionResult(null);
      saveSoloSessionResume(window.localStorage, {
        config: nextConfig,
        currentRoundId: created.currentRound.id,
        currentSessionScore: 0,
        phase: "round",
        roundEndsAt,
        roundResolution: null,
        sessionId: created.sessionId,
        sessionResult: null,
      });
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
      const nextSessionScore = currentSessionScore + resolution.result.score;
      setRoundResolution(resolution);
      setCurrentSessionScore(nextSessionScore);
      setCurrentRoundEndsAt(null);
      if (sessionId) {
        saveSoloSessionResume(window.localStorage, {
          config,
          currentRoundId: resolution.result.roundId,
          currentSessionScore: nextSessionScore,
          phase: "round-result",
          roundEndsAt: null,
          roundResolution: resolution,
          sessionId,
          sessionResult: null,
        });
      }
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
        setCurrentRound(null);
        setCurrentRoundEndsAt(null);
        saveSoloSessionResume(window.localStorage, {
          config,
          currentRoundId: null,
          currentSessionScore: results.totalScore,
          phase: "session-result",
          roundEndsAt: null,
          roundResolution: null,
          sessionId,
          sessionResult: results,
        });
        startTransition(() => {
          setPhase("session-result");
        });
      } else {
        const nextRound = await activeDataSource.getCurrentRound(sessionId);
        const roundEndsAt = createRoundEndsAt(nextRound);
        void preloadFirstAvailableRoundImage(nextRound);
        setCurrentRound(nextRound);
        setCurrentRoundEndsAt(roundEndsAt);
        setRoundResolution(null);
        saveSoloSessionResume(window.localStorage, {
          config,
          currentRoundId: nextRound.id,
          currentSessionScore,
          phase: "round",
          roundEndsAt,
          roundResolution: null,
          sessionId,
          sessionResult: null,
        });
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
    clearSoloSessionResume(window.localStorage);
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
    clearSoloSessionResume(window.localStorage);
    setMultiplayerRoomCode(null);
    setMultiplayerPlaying(false);
    setMultiplayerSidebarContext(null);
    void beginSession(createQuickSessionConfig());
  };

  const openMultiplayer = () => {
    setSidebarOpen(false);
    clearSoloSessionResume(window.localStorage);
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
    clearSoloSessionResume(window.localStorage);
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

  const updateShowTotalScoreDuringRound = (nextValue: boolean) => {
    setShowTotalScoreDuringRound(nextValue);
    window.localStorage.setItem(SHOW_TOTAL_SCORE_STORAGE_KEY, String(nextValue));
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
                onShowTotalScoreDuringRoundChange={updateShowTotalScoreDuringRound}
                onSidebarContextChange={setMultiplayerSidebarContext}
                showTotalScoreDuringRound={showTotalScoreDuringRound}
              />
            ) : null}

            {phase === "setup" ? (
              <SetupPage
                busy={busy}
                initialConfig={config}
                onShowTotalScoreDuringRoundChange={updateShowTotalScoreDuringRound}
                onSubmit={(nextConfig) => {
                  void beginSession(nextConfig);
                }}
                showTotalScoreDuringRound={showTotalScoreDuringRound}
              />
            ) : null}

            {phase === "round" && currentRound && sessionId && dataSource ? (
              <RoundPage
                busy={busy}
                round={currentRound}
                roundEndsAt={currentRoundEndsAt}
                showTotalScore={showTotalScoreDuringRound}
                totalScore={currentSessionScore}
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
                showTotalScore={showTotalScoreDuringRound}
                totalScore={currentSessionScore}
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
