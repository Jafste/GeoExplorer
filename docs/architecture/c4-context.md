# C4 Contexto

Este diagrama mostra o GeoExplorer como sistema principal e as dependências externas que uso para mapa e fontes visuais.

```mermaid
flowchart LR
    jogador["Jogador"]
    professor["Professor / avaliador"]
    sistema["GeoExplorer\nJogo web de geolocalização"]
    osm["OpenStreetMap\nTiles do mapa"]
    commons["Wikimedia Commons\nImagens e licenças"]
    panoramax["Panoramax\nPanoramas 360 e licenças"]
    mapillary["Mapillary\nFonte visual opcional"]

    jogador -->|"joga solo ou multiplayer"| sistema
    professor -->|"executa e avalia localmente"| sistema
    sistema -->|"mostra mapa real"| osm
    sistema -->|"usa imagens e atribuição"| commons
    sistema -->|"usa panoramas 360 quando existem"| panoramax
    sistema -->|"resolve thumbnails pelo backend quando há token"| mapillary
```

## Leitura rápida

- O GeoExplorer corre localmente ou em Docker, sem depender de cloud própria.
- O jogo usa um conjunto local de locais reais para reduzir risco durante a demonstração.
- OpenStreetMap é usado para o mapa interativo.
- Wikimedia Commons e Panoramax podem ser fontes principais de ronda.
- Panoramax e Mapillary também podem entrar como fontes adicionais quando têm cobertura útil.
- Mapillary não é obrigatório para correr o jogo; o token fica no ambiente local e o backend resolve thumbnails quando necessário.
