import { describe, expect, it, vi } from "vitest";
import { RoundMinimapDock } from "./RoundMinimapDock";

vi.mock("../../../components/EuropeGuessMap", () => ({
  EuropeGuessMap: () => null,
}));

function renderMinimapDock({
  busy = false,
  busyLabel,
  guess = null,
  mapHovered = false,
  mapPinnedOpen = false,
  onMouseEnter = vi.fn(),
  onMouseLeave = vi.fn(),
  onTogglePinnedOpen = vi.fn(),
}: {
  busy?: boolean;
  busyLabel?: string;
  guess?: Parameters<typeof RoundMinimapDock>[0]["guess"];
  mapHovered?: boolean;
  mapPinnedOpen?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onTogglePinnedOpen?: () => void;
} = {}) {
  const element = RoundMinimapDock({
    busy,
    busyLabel,
    guess,
    mapHovered,
    mapPinnedOpen,
    onGuessChange: vi.fn(),
    onMouseEnter,
    onMouseLeave,
    onSubmit: vi.fn(),
    onTogglePinnedOpen,
    timed: false,
  });

  return {
    element,
    onMouseEnter,
    onMouseLeave,
    onTogglePinnedOpen,
  };
}

describe("RoundMinimapDock", () => {
  it("does not expand through hover callbacks for touch pointers", () => {
    const { element, onMouseEnter, onMouseLeave } = renderMinimapDock();

    element.props.onPointerEnter?.({ pointerType: "touch" });
    element.props.onPointerLeave?.({ pointerType: "touch" });

    expect(onMouseEnter).not.toHaveBeenCalled();
    expect(onMouseLeave).not.toHaveBeenCalled();
  });

  it("keeps desktop mouse hover behaviour", () => {
    const { element, onMouseEnter, onMouseLeave } = renderMinimapDock();

    element.props.onPointerEnter?.({ pointerType: "mouse" });
    element.props.onPointerLeave?.({ pointerType: "mouse" });

    expect(onMouseEnter).toHaveBeenCalledOnce();
    expect(onMouseLeave).toHaveBeenCalledOnce();
  });

  it("labels the pinned map action as close", () => {
    const { element, onTogglePinnedOpen } = renderMinimapDock({ mapPinnedOpen: true });
    const toggle = element.props.children[0];

    expect(toggle.props["aria-label"]).toBe("Fechar mapa");

    toggle.props.onClick();

    expect(onTogglePinnedOpen).toHaveBeenCalledOnce();
  });

  it("shows a custom busy label after a multiplayer guess is submitted", () => {
    const { element } = renderMinimapDock({
      busy: true,
      busyLabel: "À espera dos outros",
      guess: { latitude: 59.3, longitude: 18.1, label: "Pino marcado" },
      mapPinnedOpen: true,
    });
    const panel = element.props.children[1];
    const footer = panel.props.children[1];
    const submitButton = footer.props.children[1];

    expect(submitButton.props.children).toBe("À espera dos outros");
  });
});
