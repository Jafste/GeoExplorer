import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "./AppSidebar";

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

describe("AppSidebar", () => {
  it("disables the analysis button when there is no last result to open", () => {
    const sidebar = AppSidebar({
      config: {
        region: "europe",
        roundCount: 5,
        timed: true,
        roundTimeSeconds: 60,
      },
      phase: "landing",
      onHome: vi.fn(),
      onOpenTutorial: vi.fn(),
      onStart: vi.fn(),
      analysisEnabled: false,
      onOpenAnalysis: vi.fn(),
    });

    const analysisButton = findButtonByLabel(sidebar, "Análise");

    expect(analysisButton).not.toBeNull();
    expect(analysisButton?.props.disabled).toBe(true);
  });

  it("routes the analysis button through a dedicated callback", () => {
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
      onOpenTutorial: vi.fn(),
      onStart: vi.fn(),
      analysisEnabled: true,
      onOpenAnalysis,
    });

    const analysisButton = findButtonByLabel(sidebar, "Análise");

    expect(analysisButton).not.toBeNull();
    expect(analysisButton?.props.onClick).toBeTypeOf("function");

    analysisButton?.props.onClick?.();

    expect(onOpenAnalysis).toHaveBeenCalledOnce();
    expect(onHome).not.toHaveBeenCalled();
  });
});
