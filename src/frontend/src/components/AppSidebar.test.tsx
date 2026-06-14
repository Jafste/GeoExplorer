import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { RoundResolutionResponse, SessionResult } from "../types/game";
import { AppSidebar } from "./AppSidebar";

type FunctionComponentForTest = (props: Record<string, unknown>) => ReactNode;
type ForwardRefComponentForTest = {
  render: (props: Record<string, unknown>, ref: null) => ReactNode;
};

function renderComponentForTest(type: unknown, props: Record<string, unknown>): ReactNode | null {
  if (typeof type === "function") {
    return (type as FunctionComponentForTest)(props);
  }

  if (
    "children" in props &&
    typeof type === "object" &&
    type !== null &&
    "render" in type &&
    typeof (type as ForwardRefComponentForTest).render === "function"
  ) {
    return (type as ForwardRefComponentForTest).render(props, null);
  }

  return null;
}

function getTextContent(node: ReactNode): string {
  type ElementProps = {
    children?: ReactNode;
  };

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (!isValidElement<ElementProps>(node)) {
    return "";
  }

  const renderedComponent = renderComponentForTest(node.type, node.props);

  if (renderedComponent) {
    return getTextContent(renderedComponent);
  }

  return Children.toArray(node.props.children)
    .map((child) => getTextContent(child))
    .join("");
}

function findButtonByLabel(
  node: ReactNode,
  label: string
): ReactElement<{ children?: ReactNode; disabled?: boolean; onClick?: () => void }> | null {
  type ButtonProps = {
    children?: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  };

  if (!isValidElement<ButtonProps>(node)) {
    return null;
  }

  const renderedComponent = renderComponentForTest(node.type, node.props);

  if (renderedComponent) {
    return findButtonByLabel(renderedComponent, label);
  }

  if (node.type === "button" && getTextContent(node).includes(label)) {
    return node;
  }

  for (const child of Children.toArray(node.props.children)) {
    const button = findButtonByLabel(child, label);

    if (button) {
      return button;
    }
  }

  return null;
}

function createRoundResolutionForTest(): RoundResolutionResponse {
  return {
    progress: {
      completed: false,
      nextRoundNumber: 2,
    },
    result: {
      city: "Lisboa",
      clues: [],
      correctLatitude: 38.7223,
      correctLongitude: -9.1393,
      country: "Portugal",
      distanceKm: 12.4,
      guess: null,
      resolution: "manual",
      roundId: "round-1",
      roundNumber: 1,
      score: 4300,
      timed: true,
      title: "Lisboa",
      visualSources: [],
    },
  };
}

function createSessionResultForTest(): SessionResult {
  return {
    roundTimeSeconds: 60,
    rounds: [],
    sessionId: "session-1",
    timed: true,
    totalRounds: 5,
    totalScore: 18500,
  };
}

describe("AppSidebar", () => {
  it("hides the report button when there is no last result to open", () => {
    const sidebar = AppSidebar({
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      phase: "landing",
      onHome: vi.fn(),
      onOpenMultiplayer: vi.fn(),
      onStart: vi.fn(),
      analysisEnabled: false,
      onOpenAnalysis: vi.fn(),
      onQuickStart: vi.fn(),
    });

    const analysisButton = findButtonByLabel(sidebar, "Último relatório");

    expect(analysisButton).toBeNull();
    expect(getTextContent(sidebar)).not.toContain("Termina uma ronda ou jogo para abrir o relatório.");
  });

  it("does not show game mode metrics on the homepage", () => {
    const sidebar = AppSidebar({
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      phase: "landing",
      onHome: vi.fn(),
      onOpenMultiplayer: vi.fn(),
      onStart: vi.fn(),
      analysisEnabled: false,
      onOpenAnalysis: vi.fn(),
      onQuickStart: vi.fn(),
    });

    const text = getTextContent(sidebar);

    expect(text).toContain("Missão rápida");
    expect(text).toContain("Configuração aleatória");
    expect(text).toContain("Início");
    expect(text).not.toContain("GeoExplorer");
    expect(text).not.toContain("Jogo de geografia");
    expect(text).not.toContain("Tutorial");
    expect(text).not.toContain("Imagem real");
    expect(text).not.toContain("Solo ou sala");
    expect(text).not.toContain("Rondas5");
    expect(text).not.toContain("Ritmo60s");
    expect(text).not.toContain("ÂmbitoEuropa");
  });

  it("shows game mode metrics when preparing a solo game", () => {
    const sidebar = AppSidebar({
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      phase: "setup",
      onHome: vi.fn(),
      onOpenMultiplayer: vi.fn(),
      onStart: vi.fn(),
      analysisEnabled: false,
      onOpenAnalysis: vi.fn(),
      onQuickStart: vi.fn(),
    });

    const text = getTextContent(sidebar);

    expect(text).toContain("Missão rápida");
    expect(text).toContain("Configuração aleatória");
    expect(text).toContain("ModoSolo");
    expect(text).toContain("Rondas5");
    expect(text).toContain("Ritmo60s");
    expect(text).toContain("ÂmbitoEuropa");
    expect(text).not.toContain("Tutorial");
    expect(text).not.toContain("5 rondas · 60s");
  });

  it("routes the round report button through a dedicated callback", () => {
    const onHome = vi.fn();
    const onOpenAnalysis = vi.fn();

    const sidebar = AppSidebar({
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      phase: "round-result",
      onHome,
      onOpenMultiplayer: vi.fn(),
      onStart: vi.fn(),
      analysisEnabled: true,
      onOpenAnalysis,
      onQuickStart: vi.fn(),
      roundResolution: createRoundResolutionForTest(),
    });

    const analysisButton = findButtonByLabel(sidebar, "Relatório da ronda");

    expect(analysisButton).not.toBeNull();
    expect(analysisButton?.props.onClick).toBeTypeOf("function");

    analysisButton?.props.onClick?.();

    expect(onOpenAnalysis).toHaveBeenCalledOnce();
    expect(onHome).not.toHaveBeenCalled();
  });

  it("labels the session analysis action as the final report", () => {
    const sidebar = AppSidebar({
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      phase: "session-result",
      onHome: vi.fn(),
      onOpenMultiplayer: vi.fn(),
      onStart: vi.fn(),
      analysisEnabled: true,
      onOpenAnalysis: vi.fn(),
      onQuickStart: vi.fn(),
      sessionResult: createSessionResultForTest(),
    });

    expect(findButtonByLabel(sidebar, "Relatório final")).not.toBeNull();
    expect(findButtonByLabel(sidebar, "Último relatório")).toBeNull();
  });

  it("routes the multiplayer rooms button through a dedicated callback", () => {
    const onOpenMultiplayer = vi.fn();

    const sidebar = AppSidebar({
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      phase: "landing",
      onHome: vi.fn(),
      onOpenMultiplayer,
      onStart: vi.fn(),
      analysisEnabled: false,
      onOpenAnalysis: vi.fn(),
      onQuickStart: vi.fn(),
    });

    const roomsButton = findButtonByLabel(sidebar, "Salas multiplayer");

    expect(roomsButton).not.toBeNull();
    expect(roomsButton?.props.onClick).toBeTypeOf("function");

    roomsButton?.props.onClick?.();

    expect(onOpenMultiplayer).toHaveBeenCalledOnce();
  });

  it("routes the quick mission button through a dedicated callback", () => {
    const onQuickStart = vi.fn();

    const sidebar = AppSidebar({
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      phase: "landing",
      onHome: vi.fn(),
      onOpenMultiplayer: vi.fn(),
      onStart: vi.fn(),
      analysisEnabled: false,
      onOpenAnalysis: vi.fn(),
      onQuickStart,
    });

    const quickStartButton = findButtonByLabel(sidebar, "Missão rápida");

    expect(quickStartButton).not.toBeNull();
    expect(quickStartButton?.props.onClick).toBeTypeOf("function");

    quickStartButton?.props.onClick?.();

    expect(onQuickStart).toHaveBeenCalledOnce();
  });

  it("shows concise multiplayer entry metrics without repeating name and timer in the header", () => {
    const sidebar = AppSidebar({
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      multiplayerContext: {
        mode: "entry",
        config: {
          region: "europe",
          roundCount: 5,
          timed: true,
          roundTimeSeconds: 60,
        },
        displayName: "Turbo Meridian 170",
        loadingOpenRooms: false,
        openRoomCount: 0,
        openRoomsLoaded: true,
      },
      phase: "multiplayer",
      onHome: vi.fn(),
      onOpenMultiplayer: vi.fn(),
      onStart: vi.fn(),
      analysisEnabled: false,
      onOpenAnalysis: vi.fn(),
      onQuickStart: vi.fn(),
    });

    const text = getTextContent(sidebar);

    expect(text).toContain("Missão rápida");
    expect(text).toContain("ModoMultiplayer");
    expect(text).toContain("Code nameTurbo Meridian 170");
    expect(text).toContain("Salas abertas0");
    expect(text).toContain("Ritmo60s");
    expect(text).not.toContain("Criar ou entrar");
    expect(text).not.toContain("0 abertas");
    expect(text).not.toContain("Turbo Meridian 170 · 60s");
  });

  it("shows room-specific multiplayer status in the sidebar", () => {
    const sidebar = AppSidebar({
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      multiplayerContext: {
        mode: "lobby",
        config: {
          region: "europe",
          roundCount: 7,
          timed: true,
          roundTimeSeconds: 30,
        },
        connectedPlayerCount: 2,
        hasPassword: false,
        isOwner: true,
        isPublic: true,
        playerCount: 3,
        roomCode: "AB12CD",
      },
      phase: "multiplayer",
      onHome: vi.fn(),
      onOpenMultiplayer: vi.fn(),
      onStart: vi.fn(),
      analysisEnabled: false,
      onOpenAnalysis: vi.fn(),
      onQuickStart: vi.fn(),
    });

    const text = getTextContent(sidebar);

    expect(text).not.toContain("Missão rápida");
    expect(text).toContain("SalaAB12CD");
    expect(text).toContain("Jogadores");
    expect(text).toContain("2/3");
    expect(text).toContain("Cargo");
    expect(text).toContain("Dono");
    expect(text).toContain("Acesso");
    expect(text).toContain("Aberta sem password");
  });
});
