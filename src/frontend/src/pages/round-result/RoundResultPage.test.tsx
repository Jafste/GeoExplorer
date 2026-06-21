import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { RoundResult } from "../../types/game";
import { RoundResultPage } from "./RoundResultPage";

vi.mock("../../components/EuropeGuessMap", () => ({
  EuropeGuessMap: () => null,
}));

const roundResult: RoundResult = {
  city: "Porto",
  clues: [],
  correctLatitude: 41.1579,
  correctLongitude: -8.6291,
  country: "Portugal",
  distanceKm: 10,
  guess: { latitude: 41, longitude: -8, label: "Porto" },
  resolution: "manual",
  roundId: "round-1",
  roundNumber: 1,
  score: 2503,
  timed: true,
  title: "Porto",
};

describe("RoundResultPage", () => {
  it("shows the round score as a delta with the accumulated total", () => {
    const html = renderToStaticMarkup(
      <RoundResultPage
        busy={false}
        progress={{ completed: false, nextRoundNumber: 2 }}
        result={roundResult}
        showTotalScore
        totalScore={6200}
        onContinue={() => undefined}
      />
    );

    expect(html).toContain("+2503 pts");
    expect(html).toContain("Total 6200 pts");
  });
});
