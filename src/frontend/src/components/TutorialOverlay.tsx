import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  Flag,
  Radar,
  TimerReset,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface TutorialOverlayProps {
  onDismiss: () => void;
}

const TUTORIAL_STEPS = [
  {
    badge: "Passo 1",
    title: "Escolhe a sessão",
    text: "Abre uma missão rápida e mantém o âmbito simples: solo, Europa, início imediato.",
    accent: "Solo clássico",
    helper: "Parte do CTA inicial e fecha primeiro os parâmetros da sessão.",
    telemetry: [
      { label: "Âmbito", value: "Europa" },
      { label: "Entrada", value: "Missão imediata" },
      { label: "Perfil", value: "Operação solo" },
    ],
    icon: Flag,
  },
  {
    badge: "Passo 2",
    title: "Define rondas e tempo",
    text: "Escolhe o número de rondas e decide entre sessão livre ou cronómetro curto.",
    accent: "45s / 60s / 90s",
    helper: "O cronómetro é opcional, por isso o fluxo mantém-se igual nos dois modos.",
    telemetry: [
      { label: "Rondas", value: "3 / 5 / 7" },
      { label: "Janela", value: "Livre ou cronometrada" },
      { label: "Cadência", value: "Curta e tática" },
    ],
    icon: TimerReset,
  },
  {
    badge: "Passo 3",
    title: "Marca e pontua",
    text: "Lê a cena, marca o mapa e fecha o palpite antes de a ronda terminar.",
    accent: "Palpite → Pontos",
    helper: "Cada ronda gera pontos, distância e um relatório final de sessão.",
    telemetry: [
      { label: "Pino", value: "Uma marcação" },
      { label: "Saída", value: "Pontuação imediata" },
      { label: "Resumo", value: "Mapa e distância" },
    ],
    icon: Trophy,
  },
] as const;

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
              Aprende o fluxo operacional em três fases.
            </h2>
            <p className="tutorial-intro">
              O tutorial segue o mesmo ritmo do produto: sessão, leitura de cena e fecho do palpite.
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
              <strong>03 passos ativos</strong>
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
              <strong>Uma ronda, uma leitura, um ponto.</strong>
              <p>
                O jogo mantém a mesma lógica entre modo livre e cronometrado. A diferença está
                apenas no ritmo da decisão.
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
                  <div className="tutorial-orbit tutorial-orbit-a" />
                  <div className="tutorial-orbit tutorial-orbit-b" />
                  <div className="tutorial-map-dot tutorial-map-dot-a" />
                  <div className="tutorial-map-dot tutorial-map-dot-b" />
                  <div className="tutorial-map-dot tutorial-map-dot-c" />
                  <div className="tutorial-visual-ribbon tutorial-visual-ribbon-left">
                    <Radar size={14} strokeWidth={2.1} />
                    <span>Leitura ativa</span>
                  </div>
                  <div className="tutorial-visual-ribbon tutorial-visual-ribbon-right">
                    <Crosshair size={14} strokeWidth={2.1} />
                    <span>Um ponto apenas</span>
                  </div>
                  <Compass className="tutorial-compass" size={20} strokeWidth={2.1} />
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
          <button
            className="button button-subtle button-compact"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
            type="button"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
            Anterior
          </button>

          <div className="tutorial-actions-right">
            <button className="button button-ghost button-compact" onClick={onDismiss} type="button">
              Ignorar
            </button>

            {isLastStep ? (
              <button className="button button-primary button-compact" onClick={onDismiss} type="button">
                Percebi
              </button>
            ) : (
              <button
                className="button button-primary button-compact"
                onClick={() => setActiveStep((current) => Math.min(TUTORIAL_STEPS.length - 1, current + 1))}
                type="button"
              >
                Seguinte
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
