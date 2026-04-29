import { RoundedButton } from "../../components/ui/roundedButton";
import { Card } from "../../components/layout/card/card";
import { EuropeGuessMap, type MapHotspot } from "../../components/EuropeGuessMap";

interface StartPageProps {
  onOpenTutorial: () => void;
  onStart: () => void;
}

export function StartPage({ onOpenTutorial, onStart }: StartPageProps) {
  const previewHotspots: MapHotspot[] = [
    { label: "Porto", latitude: 41.1402, longitude: -8.611, tone: "primary", value: "imagem real" },
    { label: "Innsbruck", latitude: 47.2692, longitude: 11.4041, tone: "neutral", value: "alpes" },
    { label: "Tallinn", latitude: 59.437, longitude: 24.7536, tone: "neutral", value: "báltico" },
  ];

  return (
    <section className="home-screen">
      <Card as="article" variant="homeHero">
        <div className="home-copy-column">
          <div className="home-kicker-row">
            <span className="eyebrow">Europa · treino geográfico</span>
            <span className="chip chip-highlight">Operação solo</span>
          </div>

          <h1 className="home-title">
            <span>Lê o terreno.</span>
            <span>Dá o palpite.</span>
          </h1>

          <p className="home-copy">
            Observa imagens reais, identifica pistas visuais e marca a tua estimativa num mapa real da Europa.
          </p>

          <div className="action-row home-cta-row">
             <RoundedButton color="neon" tone="ghost" radius="none" onClick={onOpenTutorial}>
             Ver tutorial
            </RoundedButton>
            <RoundedButton color="neon" radius="none" onClick={onStart}>
             Iniciar missão
            </RoundedButton>
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
              <strong>Observa a imagem</strong>
              <p>Procura arquitetura, relevo e contexto.</p>
            </div>
            <div className="home-step-card">
              <span className="muted-eyebrow">03</span>
              <strong>Marca o mapa</strong>
              <p>Compara distância e pontuação.</p>
            </div>
          </div>
        </div>

        <div className="home-scene-column">
          <div className="scene-window">
            <div className="scene-window-map">
              <div className="scene-window-top">
                <span className="scene-badge">Ronda 01 / 05</span>
                <span className="scene-badge scene-badge-live">Mapa real</span>
              </div>

              <EuropeGuessMap
                disabled
                guess={null}
                hotspots={previewHotspots}
                showFooter={false}
              />
            </div>

            <div className="scene-window-info-grid">
              <div className="scene-floating-card scene-floating-card-main">
                <span className="muted-eyebrow">Como se joga</span>
                <strong>Imagem real + mapa</strong>
                <p>Analisa o cenário, marca um ponto e vê a distância ao local correto.</p>
              </div>

              <div className="scene-floating-card scene-floating-card-mode">
                <span className="muted-eyebrow">Ritmo</span>
                <strong>45s / 60s / 90s</strong>
                <p>Cronómetro opcional</p>
              </div>

              <div className="scene-floating-card scene-floating-card-map">
                <span className="muted-eyebrow">Dataset</span>
                <strong>Wikimedia Commons</strong>
                <p>Fontes e licenças visíveis no resultado.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <section className="home-grid-section">
        <div className="home-grid">
          <Card as="article" variant="tactical" gridColumn="span 8">
            <div className="home-grid-feature-top">
              <span className="muted-eyebrow">Mapa de resposta</span>
              <span className="chip chip-highlight">OpenStreetMap</span>
            </div>

            <div className="home-grid-feature-visual">
              <EuropeGuessMap
                disabled
                guess={null}
                hotspots={previewHotspots}
                showFooter={false}
              />

              <div className="home-grid-feature-overlay">
                <strong>Escolhe no mapa real</strong>
                <p>Clica numa coordenada aproximada e compara depois a distância ao local correto.</p>
              </div>
            </div>
          </Card>

          <Card as="article" variant="tacticalStack" gridColumn="span 4">
            <span className="muted-eyebrow">Pistas visuais</span>
            <h3>Leitura de imagem e contexto europeu.</h3>
            <p>
              Cada ronda junta uma imagem real, pistas visuais curtas e confirmação cartográfica no
              mesmo interface.
            </p>

            <div className="home-grid-metrics">
              <div>
                <span>Fonte</span>
                <strong>Wikimedia</strong>
              </div>
              <div>
                <span>Mapa</span>
                <strong>OSM</strong>
              </div>
              <div>
                <span>Resultado</span>
                <strong>Distância + pontos</strong>
              </div>
            </div>
          </Card>

          <Card as="article" variant="tactical" gridColumn="span 4">
            <span className="muted-eyebrow">01 · objetivo</span>
            <strong>Observar</strong>
            <p>Identifica arquitetura, relevo, luz e sinais visuais úteis.</p>
          </Card>

          <Card as="article" variant="tactical" gridColumn="span 4">
            <span className="muted-eyebrow">02 · objetivo</span>
            <strong>Marcar</strong>
            <p>Escolhe uma coordenada aproximada no mapa real da Europa.</p>
          </Card>

          <Card
            as="article"
            variant="tacticalHighlight"
            gridColumn="span 4"
          >
            <span className="muted-eyebrow">03 · objetivo</span>
            <strong>Comparar</strong>
            <p>Vê distância, pontuação e fonte da imagem no resultado.</p>
          </Card>
        </div>
      </section>

      <Card as="section" variant="homeCta">
        <div>
          <span className="eyebrow">pronto a lançar</span>
          <h2>A próxima ronda está à espera.</h2>
          <p>Entra no mapa, lê a cena e confirma o teu ponto com rapidez.</p>
        </div>

        <div className="home-cta-footer-actions">
          <RoundedButton color="neon" tone="ghost" radius="none" onClick={onOpenTutorial} type="button">
            Rever resumo
          </RoundedButton>
          <RoundedButton intent="primary" radius="none" onClick={onStart} type="button">
            Entrar em missão
          </RoundedButton>
        </div>
      </Card>
    </section>
  );
}
