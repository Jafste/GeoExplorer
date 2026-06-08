# Arquitetura

Esta pasta contém os documentos de arquitetura do projeto.

## Diagramas atuais

| Ficheiro | Descrição |
|---------|-----------|
| `c4-context.md` | C4 Nível 1 — sistema, utilizadores e serviços externos. |
| `c4-containers.md` | C4 Nível 2 — frontend, backend, PostgreSQL, SignalR e fontes externas. |
| `data-model.md` | Modelo ER/PostgreSQL baseado nas entidades e migrations do Entity Framework. |
| `game-flows.md` | Fluxo solo e fluxo multiplayer com API, SignalR e base de dados. |
| `visual-sources.md` | Fluxo de fontes visuais: Wikimedia, Panoramax, Mapillary e dataset local. |
| `adr/` | Decisões de arquitetura registadas ao longo do projeto. |

## Estado atual

Decidi manter os diagramas em Markdown com Mermaid, porque assim consigo versionar a arquitetura juntamente com o código e atualizar os desenhos sem depender sempre de exportações PNG. Se for necessário para o relatório ou defesa, posso exportar estes diagramas para imagem mais tarde.

O estado atual do projeto é:

- Frontend React/Vite em modo `mock` ou `api`.
- Backend ASP.NET Core .NET 8 com Minimal API e SignalR.
- PostgreSQL em Docker, criado por migrations do Entity Framework.
- Dataset local com 1000 locais reais, imagem, licença, atribuição e coordenadas.
- Fontes visuais adicionais com Panoramax e Mapillary quando há cobertura útil.
- Multiplayer por link, salas públicas, password opcional, dono da sala e rondas sincronizadas.

## Notas sobre o modelo de dados

- **Base de dados relacional** (PostgreSQL, SQLite, MySQL): usar diagrama Entidade-Relação (ER)
- **Base de dados não-relacional** (MongoDB, Firebase, DynamoDB): usar schema diagram ou modelo de documentos
- **Sem base de dados persistente**: documentar a estrutura de dados em memória ou ficheiro

## Ferramentas sugeridas para os diagramas

- **C4:** [Structurizr](https://structurizr.com) (gratuito para uso individual) ou [draw.io](https://draw.io) com shapes C4
- **ER / modelo de dados:** [dbdiagram.io](https://dbdiagram.io) (gratuito) ou draw.io
- **Alternativa universal:** draw.io exporta PNG e é gratuito para tudo

## Referência C4

Documentação oficial: [c4model.com](https://c4model.com)  
Os níveis 1 e 2 são suficientes para a maioria dos projetos de licenciatura.
