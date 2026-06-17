import { lazy } from "react";
import type { SurfacePhase } from "./navigation";
import type { RoundResolutionResponse } from "../types/game";

const loadStartPage = () =>
  import("../pages/start/StartPage").then((module) => ({
    default: module.StartPage,
  }));
const loadSetupPage = () =>
  import("../pages/setup/SetupPage").then((module) => ({
    default: module.SetupPage,
  }));
const loadRoundPage = () =>
  import("../pages/round/RoundPage").then((module) => ({
    default: module.RoundPage,
  }));
const loadRoundResultPage = () =>
  import("../pages/round-result/RoundResultPage").then((module) => ({
    default: module.RoundResultPage,
  }));
const loadSessionResultPage = () =>
  import("../pages/session-result/SessionResultPage").then((module) => ({
    default: module.SessionResultPage,
  }));
const loadMultiplayerPage = () =>
  import("../pages/multiplayer/MultiplayerPage").then((module) => ({
    default: module.MultiplayerPage,
  }));
const loadTutorialOverlay = () =>
  import("../components/TutorialOverlay").then((module) => ({
    default: module.TutorialOverlay,
  }));

export const StartPage = lazy(loadStartPage);
export const SetupPage = lazy(loadSetupPage);
export const RoundPage = lazy(loadRoundPage);
export const RoundResultPage = lazy(loadRoundResultPage);
export const SessionResultPage = lazy(loadSessionResultPage);
export const MultiplayerPage = lazy(loadMultiplayerPage);
export const TutorialOverlay = lazy(loadTutorialOverlay);

export function prefetchPhaseModules(phase: SurfacePhase) {
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

export function getPhaseLoadingTitle(phase: SurfacePhase) {
  switch (phase) {
    case "landing":
      return "A preparar início";
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

export function getOperationLoadingTitle(
  phase: SurfacePhase,
  roundResolution: RoundResolutionResponse | null
) {
  switch (phase) {
    case "setup":
      return "A iniciar missão";
    case "round":
      return "A confirmar posição";
    case "round-result":
      return roundResolution?.progress.completed
        ? "A consolidar relatório final"
        : "A preparar próxima ronda";
    case "session-result":
      return "A preparar nova missão";
    default:
      return "A sincronizar dados";
  }
}
