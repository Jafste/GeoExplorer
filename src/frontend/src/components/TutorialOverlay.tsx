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
import { EuropeGuessMap } from "./EuropeGuessMap";
import { ButtonBase, IconButton } from "./ui/Button";
import { RoundedButton } from "./ui/roundedButton";

interface TutorialOverlayProps {
  onDismiss: () => void;
}

const TUTORIAL_STEPS = [
  {
    badge: "Passo 1",
    title: "Prepara a missão",
    text: "Escolhe quantos alvos vais localizar, define se há cronómetro e decide se jogas a solo ou numa sala.",
    accent: "3 / 5 / 7 rondas",
    helper: "No modo multiplayer, o líder da sala fecha o briefing antes de lançar a missão.",
    icon: Flag,
  },
  {
    badge: "Passo 2",
    title: "Analisa a imagem",
    text: "Cada ronda mostra uma fotografia de um local europeu. Procura pistas na arquitetura, relevo, luz e contexto urbano.",
    accent: "Imagem + pistas",
    helper: "A imagem pode vir de Wikimedia Commons, Panoramax ou Mapillary. A fonte exata aparece no resultado.",
    icon: Camera,
  },
  {
    badge: "Passo 3",
    title: "Marca a posição",
    text: "Abre o mapa, aproxima a zona que achas correta e coloca o pino no ponto mais provável.",
    accent: "Mapa real",
    helper: "Só podes enviar uma posição por ronda. No multiplayer, cada jogador marca o seu próprio ponto.",
    icon: MapPinned,
  },
  {
    badge: "Passo 4",
    title: "Confirma o alvo",
    text: "No fim da ronda vês a distância ao local correto, a pontuação, as pistas e a fonte usada pela imagem.",
    accent: "Distância → pontos",
    helper: "Numa sala, o resultado aparece quando todos enviam a posição ou quando o tempo termina.",
    icon: Trophy,
  },
] as const;

const tutorialGuess = {
  latitude: 48.8566,
  longitude: 2.3522,
  label: "Posição exemplo",
};

const tutorialActual = {
  latitude: 48.2082,
  longitude: 16.3738,
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
    <div className="tutorial-backdrop">
      <button
        aria-label="Fechar tutorial"
        className="tutorial-scrim"
        onClick={onDismiss}
        type="button"
      />
      <section
        aria-describedby="tutorial-description"
        aria-labelledby="tutorial-title"
        aria-modal="true"
        className="tutorial-shell"
        role="dialog"
      >
        <div className="tutorial-header">
          <div className="tutorial-header-copy">
            <span className="eyebrow">primeiro acesso</span>
            <h2 id="tutorial-title" className="tutorial-title">
              Segue o briefing da missão em quatro passos.
            </h2>
            <p className="tutorial-intro">
              O tutorial segue o mesmo ritmo do jogo: preparar, analisar, marcar no mapa e confirmar o alvo.
            </p>
          </div>

          <IconButton label="Fechar tutorial" className="tutorial-close" onClick={onDismiss}>
            <X size={18} strokeWidth={2.4} />
          </IconButton>
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
                  <ButtonBase
                    aria-current={activeStep === index ? "step" : undefined}
                    className={`tutorial-progress-dot${activeStep === index ? " is-active" : ""}`}
                    key={item.title}
                    onClick={() => setActiveStep(index)}
                  >
                    <span className="tutorial-progress-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="tutorial-progress-copy">
                      <RailIcon size={16} strokeWidth={2.1} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.accent}</small>
                      </span>
                    </span>
                  </ButtonBase>
                );
              })}
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
                    comparisonDistanceKm={1034}
                    disabled
                    fitToMarkers
                    guess={tutorialGuess}
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
