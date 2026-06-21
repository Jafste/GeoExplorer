import React, { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Card, type CardProps } from "./card";

type TestElementProps = {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

function renderCard(props: CardProps): ReactElement<TestElementProps> {
  const rendered = Card(props);

  if (!isValidElement<TestElementProps>(rendered)) {
    throw new Error("Card did not render a React element.");
  }

  return rendered;
}

describe("Card", () => {
  it("renders the selected variant without wrapping children", () => {
    const card = renderCard({
      variant: "tactical",
      children: <p>Conteudo</p>,
    });

    expect(card.props.className).toContain("card-tactical");
    expect(card.props.children).toEqual(<p>Conteudo</p>);
  });

  it("applies optional layout styles", () => {
    const card = renderCard({
      variant: "inset",
      gridColumn: "1 / -1",
      children: <p>Conteudo</p>,
    });

    expect(card.props.className).toContain("card-inset");
    expect(card.props.style).toMatchObject({ gridColumn: "1 / -1" });
  });
});
