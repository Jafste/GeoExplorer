interface StartPageProps {
  onOpenTutorial: () => void;
  onStart: () => void;
}

export function StartPage({ onOpenTutorial, onStart }: StartPageProps) {
  return (
    <section className="home-screen">
      <article className="home-hero-card">
        <div className="home-copy-column">
          <div className="home-kicker-row">
            <span className="eyebrow">Europe only</span>
            <span className="chip chip-highlight">Classic solo</span>
          </div>

          <h1 className="home-title">
            <span>Explore Europe.</span>
            <span>Guess from the scene.</span>
          </h1>

          <p className="home-copy">
            Short rounds, clean clues and one map flow built to feel closer to a real game surface.
          </p>

          <div className="action-row home-cta-row">
            <button className="button button-ghost" onClick={onOpenTutorial} type="button">
              How it works
            </button>

            <button className="button button-primary" onClick={onStart} type="button">
              Start session
            </button>
          </div>

          <div className="home-chip-row">
            <span className="chip chip-soft">Solo</span>
            <span className="chip chip-soft">Europe</span>
            <span className="chip chip-soft">Timed or untimed</span>
          </div>

          <div className="home-step-strip">
            <div className="home-step-card">
              <span className="muted-eyebrow">01</span>
              <strong>Set the match</strong>
              <p>Pick rounds and timer.</p>
            </div>
            <div className="home-step-card">
              <span className="muted-eyebrow">02</span>
              <strong>Read the scene</strong>
              <p>Use short visual clues.</p>
            </div>
            <div className="home-step-card">
              <span className="muted-eyebrow">03</span>
              <strong>Drop the pin</strong>
              <p>Lock the score.</p>
            </div>
          </div>
        </div>

        <div className="home-scene-column">
          <div className="scene-window">
            <div className="scene-window-top">
              <span className="scene-badge">Round #1 / 5</span>
              <span className="scene-badge scene-badge-live">0 Points</span>
            </div>

            <div className="scene-sky" />
            <div className="scene-haze" />
            <div className="scene-road" />
            <div className="scene-rails" />
            <div className="scene-landmark scene-landmark-left" />
            <div className="scene-landmark scene-landmark-center" />
            <div className="scene-landmark scene-landmark-right" />

            <div className="scene-floating-card scene-floating-card-main">
              <span className="muted-eyebrow">Current mode</span>
              <strong>Title</strong>
              <p>Texto</p>
            </div>

            <div className="scene-floating-card scene-floating-card-map">
              <span className="muted-eyebrow">Preview</span>
              <div className="scene-mini-map">
                <span className="scene-mini-map-dot scene-mini-map-dot-a" />
                <span className="scene-mini-map-dot scene-mini-map-dot-b" />
                <span className="scene-mini-map-dot scene-mini-map-dot-c" />
              </div>
            </div>

            <div className="scene-floating-card scene-floating-card-mode">
              <span className="muted-eyebrow">Pace</span>
              <strong>45s / 60s / 90s</strong>
              <p>Optional timer</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
