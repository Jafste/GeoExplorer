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
            <span className="eyebrow">Europa · treino tático</span>
            <span className="chip chip-highlight">Operação solo</span>
          </div>

          <h1 className="home-title">
            <span>Lê o terreno.</span>
            <span>Dá o palpite.</span>
          </h1>

          <p className="home-copy">
            Sessões curtas, pistas visuais e um mapa europeu num interface com ritmo de missão.
          </p>

          <div className="action-row home-cta-row">
            <button className="button button-ghost" onClick={onOpenTutorial} type="button">
              Ver tutorial
            </button>

            <button className="button button-primary" onClick={onStart} type="button">
              Iniciar missão
            </button>
          </div>

          <div className="home-chip-row">
            <span className="chip chip-soft">Solo</span>
            <span className="chip chip-soft">Europa</span>
            <span className="chip chip-soft">Com ou sem cronómetro</span>
          </div>

          <div className="home-step-strip">
            <div className="home-step-card">
              <span className="muted-eyebrow">01</span>
              <strong>Configura a sessão</strong>
              <p>Escolhe rondas e ritmo.</p>
            </div>
            <div className="home-step-card">
              <span className="muted-eyebrow">02</span>
              <strong>Lê a cena</strong>
              <p>Interpreta o ambiente.</p>
            </div>
            <div className="home-step-card">
              <span className="muted-eyebrow">03</span>
              <strong>Marca o mapa</strong>
              <p>Fecha a pontuação.</p>
            </div>
          </div>
        </div>

        <div className="home-scene-column">
          <div className="scene-window">
            <div className="scene-window-top">
              <span className="scene-badge">Ronda 01 / 05</span>
              <span className="scene-badge scene-badge-live">Ligação segura</span>
            </div>

            <div className="scene-sky" />
            <div className="scene-haze" />
            <div className="scene-road" />
            <div className="scene-rails" />
            <div className="scene-landmark scene-landmark-left" />
            <div className="scene-landmark scene-landmark-center" />
            <div className="scene-landmark scene-landmark-right" />

            <div className="scene-floating-card scene-floating-card-main">
              <span className="muted-eyebrow">Perfil da missão</span>
              <strong>Solo clássico</strong>
              <p>Uma leitura visual, um ponto, resposta imediata.</p>
            </div>

            <div className="scene-floating-card scene-floating-card-map">
              <span className="muted-eyebrow">Teatro</span>
              <div className="scene-mini-map">
                <span className="scene-mini-map-dot scene-mini-map-dot-a" />
                <span className="scene-mini-map-dot scene-mini-map-dot-b" />
                <span className="scene-mini-map-dot scene-mini-map-dot-c" />
              </div>
            </div>

            <div className="scene-floating-card scene-floating-card-mode">
              <span className="muted-eyebrow">Ritmo</span>
              <strong>45s / 60s / 90s</strong>
              <p>Cronómetro opcional</p>
            </div>
          </div>
        </div>
      </article>

      <section className="home-grid-section">
        <div className="home-grid">
          <article className="home-grid-feature">
            <div className="home-grid-feature-top">
              <span className="muted-eyebrow">HUD tático</span>
              <span className="chip chip-highlight">SUPERFÍCIE ATIVA</span>
            </div>

            <div className="home-grid-feature-visual">
              <div className="home-grid-feature-overlay">
                <strong>Geolocalização avançada</strong>
                <p>Painel imersivo para leitura visual, pistas curtas e decisão rápida no mapa.</p>
              </div>
            </div>
          </article>

          <article className="home-grid-intel">
            <span className="muted-eyebrow">Análise de sinais</span>
            <h3>Leitura operacional do terreno europeu.</h3>
            <p>
              Cada ronda cruza pistas urbanas, ritmo de jogo e confirmação cartográfica no mesmo
              interface.
            </p>

            <div className="home-grid-metrics">
              <div>
                <span>Sinal</span>
                <strong>98.2%</strong>
              </div>
              <div>
                <span>Latência</span>
                <strong>12 ms</strong>
              </div>
              <div>
                <span>Encriptação</span>
                <strong>AES-256</strong>
              </div>
            </div>
          </article>

          <article className="home-grid-objective">
            <span className="muted-eyebrow">01 · objetivo</span>
            <strong>Vigilância</strong>
            <p>Leitura de espaço urbano, sinalética e morfologia local.</p>
          </article>

          <article className="home-grid-objective">
            <span className="muted-eyebrow">02 · objetivo</span>
            <strong>Reconhecimento</strong>
            <p>Confirmação visual rápida com foco em pistas com maior valor geográfico.</p>
          </article>

          <article className="home-grid-objective home-grid-objective-highlight">
            <span className="muted-eyebrow">03 · objetivo</span>
            <strong>Dados cruzados</strong>
            <p>Cruza contexto, distância e pontuação num único ciclo de ronda.</p>
          </article>
        </div>
      </section>

      <section className="home-cta-footer">
        <div>
          <span className="eyebrow">pronto a lançar</span>
          <h2>A próxima ronda está à espera.</h2>
          <p>Entra no mapa, lê a cena e confirma o teu ponto com rapidez.</p>
        </div>

        <div className="home-cta-footer-actions">
          <button className="button button-ghost" onClick={onOpenTutorial} type="button">
            Rever resumo
          </button>
          <button className="button button-primary" onClick={onStart} type="button">
            Entrar em missão
          </button>
        </div>
      </section>
    </section>
  );
}
