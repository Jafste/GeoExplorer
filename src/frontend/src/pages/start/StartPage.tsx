import { RoundedButton } from "../../components/ui/roundedButton";
import { Card } from "../../components/layout/card/card";
import { EuropeGuessMap, type MapHotspot } from "../../components/EuropeGuessMap";
import logoMark from "../../assets/branding/logo_geoExplorer.png";

interface StartPageProps {
  onMultiplayer: () => void;
  onStart: () => void;
}

export function StartPage({ onMultiplayer, onStart }: StartPageProps) {
  const previewHotspots: MapHotspot[] = [
    { label: "Porto", latitude: 41.1402, longitude: -8.611, tone: "primary", value: "imagem real" },
    { label: "Innsbruck", latitude: 47.2692, longitude: 11.4041, tone: "neutral", value: "alpes" },
    { label: "Tallinn", latitude: 59.437, longitude: 24.7536, tone: "neutral", value: "báltico" },
  ];

  return (
    <section className="home-screen">
      <Card as="article" variant="homeHero">
        <div className="home-copy-column">
          <div className="home-brand-lockup" aria-label="GeoExplorer">
            <img alt="" aria-hidden="true" src={logoMark} />
            <span>GeoExplorer</span>
          </div>

          <h1 className="home-title">
            <span>Localiza o alvo</span>
            <span>desta imagem.</span>
          </h1>

          <p className="home-copy">
            Cada ronda é uma missão curta: observa uma imagem real, lê o cenário e encontra
            o ponto no mapa. As imagens podem vir de Wikimedia Commons, Panoramax ou Mapillary;
            no resultado ficam a fonte, licença e atribuição.
          </p>

          <div className="action-row home-cta-row">
            <RoundedButton color="neon" radius="none" onClick={onStart}>
              Começar missão
            </RoundedButton>
            <RoundedButton color="neon" tone="subtle" radius="none" onClick={onMultiplayer}>
              Criar sala
            </RoundedButton>
          </div>

          <div className="home-step-strip" aria-label="Fluxo da missão">
            <div className="home-step-card">
              <span className="muted-eyebrow">01</span>
              <strong>Prepara a missão</strong>
              <p>Escolhe rondas, ritmo e se jogas solo ou em sala.</p>
            </div>
            <div className="home-step-card">
              <span className="muted-eyebrow">02</span>
              <strong>Identifica o alvo</strong>
              <p>Procura arquitetura, relevo, clima e sinais visuais.</p>
            </div>
            <div className="home-step-card">
              <span className="muted-eyebrow">03</span>
              <strong>Marca a posição</strong>
              <p>Aponta no mapa e compara a distância ao local correto.</p>
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
                <span className="muted-eyebrow">Fontes visuais</span>
                <strong>Wikimedia · Panoramax · Mapillary</strong>
                <p>O jogo usa 6000 locais reais; a fonte exata aparece no resultado da ronda.</p>
              </div>

              <div className="scene-floating-card scene-floating-card-map">
                <span className="muted-eyebrow">Mapa de resposta</span>
                <strong>OpenStreetMap</strong>
                <p>Marca a tua posição num mapa real e compara a distância ao local correto.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
