import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Flag,
  MapPinned,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EuropeGuessMap, type MapHotspot } from "./EuropeGuessMap";
import { RoundedButton } from "./ui/roundedButton";

interface TutorialOverlayProps {
  onDismiss: () => void;
}

const TUTORIAL_STEPS = [
  {
    badge: "Passo 1",
    title: "Configura a sessão",
    text: "Escolhe quantas rondas queres jogar e se preferes jogar com ou sem cronómetro.",
    accent: "3 / 5 / 7 rondas",
    helper: "O modo é individual e focado na Europa, para manter a demo simples e direta.",
    telemetry: [
      { label: "Âmbito", value: "Europa" },
      { label: "Perfil", value: "Individual" },
      { label: "Ritmo", value: "Opcional" },
    ],
    icon: Flag,
  },
  {
    badge: "Passo 2",
    title: "Observa a imagem real",
    text: "Cada ronda mostra uma fotografia de um local europeu. Procura pistas na arquitetura, relevo, luz e contexto urbano.",
    accent: "Imagem + pistas",
    helper: "As pistas ajudam a orientar a leitura, mas a resposta final depende do teu palpite no mapa.",
    telemetry: [
      { label: "Fonte", value: "Wikimedia" },
      { label: "Leitura", value: "Visual" },
      { label: "Pistas", value: "Contextuais" },
    ],
    icon: Camera,
  },
  {
    badge: "Passo 3",
    title: "Marca no mapa real",
    text: "Abre o mapa, aproxima a zona que achas correta e coloca o pino no ponto mais provável.",
    accent: "Mapa real",
    helper: "Só existe uma submissão por ronda. Depois de enviares o palpite, o resultado fica fechado.",
    telemetry: [
      { label: "Mapa", value: "OpenStreetMap" },
      { label: "Pino", value: "Uma submissão" },
      { label: "Tempo", value: "Opcional" },
    ],
    icon: MapPinned,
  },
  {
    badge: "Passo 4",
    title: "Compara o resultado",
    text: "No fim da ronda vês a distância ao local correto, a pontuação, as pistas e a fonte/licença da imagem.",
    accent: "Distância → pontos",
    helper: "O relatório final junta todas as rondas para veres onde acertaste melhor e onde te desviaste.",
    telemetry: [
      { label: "Pontuação", value: "Imediata" },
      { label: "Fonte", value: "Visível" },
      { label: "Resumo", value: "Final" },
    ],
    icon: Trophy,
  },
] as const;

const tutorialHotspots: MapHotspot[] = [
  { label: "Porto", latitude: 41.1402, longitude: -8.611, tone: "primary", value: "exemplo" },
  { label: "Innsbruck", latitude: 47.2692, longitude: 11.4041, tone: "neutral", value: "alpes" },
  { label: "Tallinn", latitude: 59.437, longitude: 24.7536, tone: "neutral", value: "báltico" },
];

const tutorialGuess = {
  latitude: 45.4642,
  longitude: 9.19,
  label: "Palpite exemplo",
};

const tutorialActual = {
  latitude: 47.2692,
  longitude: 11.4041,
  label: "Local correto",
};

export function TutorialOverlay({ onDismiss }: TutorialOverlayProps) {
  const [activeStep, setActiveStep] = useState(0);
  const isLastStep = activeStep === TUTORIAL_STEPS.length - 1;
  const step = TUTORIAL_STEPS[activeStep];
  const StepIcon = step.icon;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveStep((current) => Math.min(TUTORIAL_STEPS.length - 1, current + 1));
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveStep((current) => Math.max(0, current - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDismiss]);

  return (
    <div className="tutorial-backdrop" onClick={onDismiss} role="presentation">
      <section
        aria-describedby="tutorial-description"
        aria-labelledby="tutorial-title"
        aria-modal="true"
        className="tutorial-shell"
        onClick={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
      >
        <div className="tutorial-header">
          <div className="tutorial-header-copy">
            <span className="eyebrow">primeiro acesso</span>
            <h2 id="tutorial-title" className="tutorial-title">
              Aprende o fluxo do jogo em quatro passos.
            </h2>
            <p className="tutorial-intro">
              O tutorial segue o mesmo ritmo do produto: configurar, observar, marcar no mapa e comparar o resultado.
            </p>
          </div>

          <button aria-label="Fechar tutorial" className="tutorial-close" onClick={onDismiss} type="button">
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="tutorial-layout">
          <aside className="tutorial-rail">
            <div className="tutorial-rail-head">
              <span className="muted-eyebrow">Fluxo guiado</span>
              <strong>04 passos ativos</strong>
            </div>

            <div className="tutorial-progress" aria-label="Progresso do tutorial">
              {TUTORIAL_STEPS.map((item, index) => {
                const RailIcon = item.icon;
                return (
                  <button
                    aria-current={activeStep === index ? "step" : undefined}
                    className={`tutorial-progress-dot${activeStep === index ? " is-active" : ""}`}
                    key={item.title}
                    onClick={() => setActiveStep(index)}
                    type="button"
                  >
                    <span className="tutorial-progress-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="tutorial-progress-copy">
                      <RailIcon size={16} strokeWidth={2.1} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.accent}</small>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="tutorial-rail-card">
              <span className="muted-eyebrow">Protocolo</span>
              <strong>Uma imagem, um pino, uma pontuação.</strong>
              <p>
                O jogo usa imagens reais e um mapa real. O cronómetro só muda o ritmo da decisão.
              </p>
              <span className="tutorial-rail-hint">Esc fecha. Setas esquerda/direita navegam os passos.</span>
            </div>
          </aside>

          <div className="tutorial-stage">
            <div className="tutorial-stage-head">
              <div>
                <span className="muted-eyebrow">{step.badge}</span>
                <h3>{step.title}</h3>
              </div>

              <span className="chip chip-highlight">{step.accent}</span>
            </div>

            <div className="tutorial-body">
              <div className="tutorial-visual">
                <div className="tutorial-icon-ring">
                  <StepIcon size={28} strokeWidth={2.2} />
                </div>

                <div className="tutorial-visual-card">
                  <span className="muted-eyebrow">Janela ativa</span>
                  <strong>{step.accent}</strong>
                  <p>{step.helper}</p>
                </div>

                <div className="tutorial-visual-map">
                  <EuropeGuessMap
                    actual={tutorialActual}
                    comparisonDistanceKm={284}
                    disabled
                    guess={tutorialGuess}
                    hotspots={tutorialHotspots}
                    showComparisonLine
                    showFooter={false}
                    showMarkerLabels
                  />
                </div>
              </div>

              <div className="tutorial-copy">
                <div className="tutorial-copy-main">
                  <p id="tutorial-description">{step.text}</p>
                </div>

                <div className="tutorial-data-grid">
                  {step.telemetry.map((item) => (
                    <div className="tutorial-data-card" key={item.label}>
                      <span className="muted-eyebrow">{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tutorial-actions">
          <RoundedButton
            color="neon"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
            radius="none"
            size="compact"
            tone="subtle"
            type="button"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
            Anterior
          </RoundedButton>

          <div className="tutorial-actions-right">
            <RoundedButton color="neon" tone="ghost" size="compact" radius="none" onClick={onDismiss} type="button">
              Ignorar
            </RoundedButton>

            {isLastStep ? (
              <RoundedButton intent="primary" size="compact" radius="none" onClick={onDismiss} type="button">
                Percebi
              </RoundedButton>
            ) : (
              <RoundedButton
                intent="primary"
                onClick={() => setActiveStep((current) => Math.min(TUTORIAL_STEPS.length - 1, current + 1))}
                radius="none"
                size="compact"
                type="button"
              >
                Seguinte
                <ChevronRight size={16} strokeWidth={2.2} />
              </RoundedButton>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
