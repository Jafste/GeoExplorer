import React, { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Card, type CardProps } from "./card";

type TestElementProps = {
  children?: ReactNode;
  className?: string;
};

function renderCard(props: CardProps): ReactElement<TestElementProps> {
  const rendered = Card(props);

  if (!isValidElement<TestElementProps>(rendered)) {
    throw new Error("Card did not render a React element.");
  }

  return rendered;
}

function getChildElements(element: ReactElement<TestElementProps>): ReactElement<TestElementProps>[] {
  return Children.toArray(element.props.children).flatMap((child) => {
    if (!isValidElement<TestElementProps>(child)) {
      return [];
    }

    if (child.type === React.Fragment) {
      return getChildElements(child);
    }

    return [child];
  });
}

describe("Card", () => {
  it("wraps default card content in a padded content container", () => {
    const card = renderCard({
      title: "Resumo",
      children: <p>Conteudo</p>,
    });

    const [contentWrapper] = getChildElements(card);

    expect(card.props.className).toContain("relative rounded-xl");
    expect(contentWrapper?.type).toBe("div");
    expect(contentWrapper?.props.className).toBe("p-4");
  });

  it("keeps direct-content variants from wrapping children just because a title is present", () => {
    const card = renderCard({
      variant: "tactical",
      title: "Resumo",
      children: <p>Conteudo</p>,
    });

    const directChildren = getChildElements(card);

    expect(card.props.className).toContain("card-tactical");
    expect(directChildren).toHaveLength(2);
    expect(directChildren[0]?.type).toBe("div");
    expect(directChildren[1]?.type).toBe("p");
  });
});
