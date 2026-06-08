# Fluxos de Jogo

## Fluxo Solo

```mermaid
sequenceDiagram
    actor Jogador
    participant Frontend
    participant API as Backend API
    participant DB as PostgreSQL

    Jogador->>Frontend: Escolhe configuração
    Frontend->>API: POST /api/sessions
    API->>DB: Importa/carrega catálogo se necessário
    API->>DB: Guarda sessão e rondas
    API-->>Frontend: Sessão + ronda atual
    Jogador->>Frontend: Marca ponto no mapa
    Frontend->>API: POST /api/sessions/{id}/rounds/{roundId}/guess
    API->>API: Valida coordenadas e calcula distância/pontuação
    API->>DB: Guarda resultado da ronda
    API-->>Frontend: Resultado da ronda
    Frontend->>API: GET /api/sessions/{id}/results
    API-->>Frontend: Relatório final
```

## Fluxo Multiplayer

```mermaid
sequenceDiagram
    actor Dono
    actor Convidado
    participant Frontend
    participant Hub as SignalR Hub
    participant DB as PostgreSQL

    Dono->>Frontend: Cria sala
    Frontend->>Hub: CreateRoom
    Hub->>DB: Guarda sala e dono
    Hub-->>Frontend: Código/link da sala
    Convidado->>Frontend: Entra por link ou lista pública
    Frontend->>Hub: JoinRoom
    Hub->>DB: Guarda jogador
    Hub-->>Frontend: Estado da sala
    Dono->>Frontend: Inicia partida
    Frontend->>Hub: StartGame
    Hub->>DB: Guarda ronda e fonte visual escolhida
    Hub-->>Frontend: Ronda sincronizada
    Dono->>Hub: SubmitGuess
    Convidado->>Hub: SubmitGuess
    Hub->>Hub: Fecha ronda quando todos submetem ou o tempo termina
    Hub->>DB: Guarda palpites, pontuações e estado final
    Hub-->>Frontend: Resultado e classificação
```

## Regras principais

- No modo solo e no multiplayer, cada jogador só submete um palpite por ronda.
- O backend valida coordenadas, labels e códigos de sala.
- No multiplayer, o dono escolhe a configuração antes de iniciar.
- O resultado da ronda multiplayer aparece quando todos os jogadores ativos submetem ou quando o tempo termina.
- O frontend em modo `mock` mantém a demonstração rápida, mas o modo `api` é o fluxo real.
