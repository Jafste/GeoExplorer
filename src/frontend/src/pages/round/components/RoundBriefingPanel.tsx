import type { ChallengeRound } from "../../../types/game";
import { formatCategoryLabel } from "../utils/roundFormat";

interface RoundBriefingPanelProps {
  round: ChallengeRound;
}

export function RoundBriefingPanel({ round }: RoundBriefingPanelProps) {
  return (
    <aside className="round-briefing-panel">
      <div className="round-briefing-head">
        <span className="muted-eyebrow">Alvo ativo</span>
        <h2>{round.challenge.title}</h2>
        <p>{round.challenge.prompt}</p>
      </div>

      <div className="round-briefing-meta">
        <div className="round-briefing-meta-item">
          <span className="muted-eyebrow">Tipo de alvo</span>
          <strong>{formatCategoryLabel(round.challenge.category)}</strong>
          <span>Leitura visual em terreno europeu</span>
        </div>

        <div className="round-briefing-meta-item">
          <span className="muted-eyebrow">Janela</span>
          <strong>{round.timed ? "Cronómetro ativo" : "Sem cronómetro"}</strong>
          <span>Uma única posição no mapa</span>
        </div>
      </div>
    </aside>
  );
}
