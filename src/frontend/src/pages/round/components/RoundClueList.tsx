import type { ChallengeClue } from "../../../types/game";

interface RoundClueListProps {
  clues: ChallengeClue[];
}

export function RoundClueList({ clues }: RoundClueListProps) {
  if (clues.length === 0) {
    return <span className="multiplayer-empty-state">Sem dicas disponíveis nesta ronda.</span>;
  }

  return clues.map((clue) => (
    <div className="multiplayer-clue-item" key={clue.label}>
      <div>
        <span className="muted-eyebrow">{clue.label}</span>
        <strong>{clue.value}</strong>
      </div>
      <span>{clue.confidence}</span>
    </div>
  ));
}
