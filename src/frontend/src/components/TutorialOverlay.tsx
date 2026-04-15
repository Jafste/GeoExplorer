import { ChevronLeft, ChevronRight, Compass, Flag, TimerReset, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TutorialOverlayProps {
  onDismiss: () => void;
}

const TUTORIAL_STEPS = [
  {
    badge: "Step 1",
    title: "Choose the match",
    text: "Open a quick session and keep the scope clean: solo, Europe, fast start.",
    accent: "Classic solo",
    helper: "Start from the home CTA and lock the session first.",
    icon: Flag,
  },
  {
    badge: "Step 2",
    title: "Set rounds and timer",
    text: "Pick the round count, then switch between untimed or a short countdown.",
    accent: "45s / 60s / 90s",
    helper: "The timer stays optional, so the same flow works in both modes.",
    icon: TimerReset,
  },
  {
    badge: "Step 3",
    title: "Drop a pin and score",
    text: "Read the scene, click the map and lock the guess before the round closes.",
    accent: "Guess → Score",
    helper: "Each round resolves into points, distance and a final session summary.",
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDismiss]);

  return (
    <div className="tutorial-backdrop" role="presentation">
      <section
        aria-describedby="tutorial-description"
        aria-labelledby="tutorial-title"
        aria-modal="true"
        className="tutorial-shell"
        role="dialog"
      >
        <div className="tutorial-header">
          <div className="tutorial-header-copy">
            <span className="eyebrow">first run</span>
            <h2 id="tutorial-title" className="tutorial-title">
              Learn the flow in three short steps.
            </h2>
          </div>

          <button aria-label="Fechar tutorial" className="tutorial-close" onClick={onDismiss} type="button">
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="tutorial-progress" aria-label="Progresso do tutorial">
          {TUTORIAL_STEPS.map((item, index) => (
            <button
              aria-current={activeStep === index}
              className={`tutorial-progress-dot${activeStep === index ? " is-active" : ""}`}
              key={item.title}
              onClick={() => setActiveStep(index)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>

        <div className="tutorial-body">
          <div className="tutorial-visual">
            <div className="tutorial-icon-ring">
              <StepIcon size={28} strokeWidth={2.2} />
            </div>

            <div className="tutorial-visual-card">
              <span className="muted-eyebrow">{step.badge}</span>
              <strong>{step.accent}</strong>
              <p>{step.helper}</p>
            </div>

            <div className="tutorial-visual-map">
              <div className="tutorial-orbit tutorial-orbit-a" />
              <div className="tutorial-orbit tutorial-orbit-b" />
              <div className="tutorial-map-dot tutorial-map-dot-a" />
              <div className="tutorial-map-dot tutorial-map-dot-b" />
              <div className="tutorial-map-dot tutorial-map-dot-c" />
              <Compass className="tutorial-compass" size={20} strokeWidth={2.1} />
            </div>
          </div>

          <div className="tutorial-copy">
            <span className="muted-eyebrow">{step.badge}</span>
            <h3>{step.title}</h3>
            <p id="tutorial-description">{step.text}</p>
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
            Back
          </button>

          <div className="tutorial-actions-right">
            <button className="button button-ghost button-compact" onClick={onDismiss} type="button">
              Skip
            </button>

            {isLastStep ? (
              <button className="button button-primary button-compact" onClick={onDismiss} type="button">
                Got it
              </button>
            ) : (
              <button
                className="button button-primary button-compact"
                onClick={() => setActiveStep((current) => Math.min(TUTORIAL_STEPS.length - 1, current + 1))}
                type="button"
              >
                Next
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
