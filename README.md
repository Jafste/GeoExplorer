# GeoExplorer

> Plataforma web de jogos de geolocalização para treino em OSINT, com desafios baseados em locais de interesse georreferenciados na Europa.

**Estudante:** Marcos Monteiro · 1902045  
**Orientador:** Pedro Pestana  
**UC:** Projeto de Engenharia Informática · Universidade Aberta · 2025/26  
**Repositório:** https://github.com/Jafste/GeoExplorer

---

## Estado atual

🟢 **Verde** — A proposta foi aprovada e já estruturei os documentos principais da Entrega 1. Também implementei um frontend jogável com mapa real e 250 locais reais, e o backend em ASP.NET Core já suporta o fluxo principal. Quando as opções de PostgreSQL estão ativas, o projeto já guarda catálogo, sessões, rondas, palpites e resultados em base de dados, incluindo a recuperação de sessões guardadas após reinício do serviço. Também validei o frontend em modo `api` com backend e PostgreSQL em Docker, passando por criação de sessão, rondas, palpites e relatório final. Preparei várias fontes visuais por local, validei Panoramax em 95 locais e passei a escolher uma fonte visual por ronda. Mantive PostgreSQL em Docker como base principal; Supabase completo fica como hipótese futura e Turso/libSQL só será reavaliado depois de observar dados reais de uso.

---

## O que está implementado

- [x] Proposta de projeto aprovada e documentação de âmbito preenchida
- [x] Wireframes e documentos de arquitetura normalizados para o template
- [x] Frontend inicial com React + TypeScript + Vite
- [x] Sistema visual base com Tailwind e paleta inicial do projeto
- [x] Componentes UI e auxiliares de layout reutilizáveis para a interface
- [x] Fluxo jogável local com ecrãs de início, configuração, ronda, resultado da ronda, relatório final e tutorial
- [x] Camada de dados abstrata com suporte a `mock` e `api`
- [x] Dataset europeu inicial com cenas mock, caminhos `sceneImage` e contratos de jogo
- [x] Assets visuais `mock` para cenas de jogo
- [x] Mapa real no frontend com OpenStreetMap/Leaflet
- [x] 250 locais reais com imagem, fonte, licença e atribuição
- [x] Resultados de ronda com dados de fonte/licença e respetivas ligações
- [x] Campo `visualSources` preparado para várias fontes visuais por local
- [x] 95 locais com fonte adicional Panoramax validada
- [x] Ferramenta local para procurar candidatos Mapillary com token fora do repositório
- [x] Escolha de uma fonte visual disponível por ronda com atribuição e licença
- [x] Testes de validação do dataset real e contratos backend/frontend
- [x] Interface em português
- [x] Execução local do frontend preparada
- [x] Backend inicial ASP.NET Core para sessões, ronda atual, submissão de palpite, timeout e resultados
- [x] Docker Compose com perfis de execução
- [x] Testes mínimos de contrato do backend
- [x] Decisão de arquitetura para PostgreSQL em Docker e SignalR futuro
- [x] Importação do catálogo de locais para PostgreSQL com Entity Framework Core
- [x] Migrations do Entity Framework para criar o schema em PostgreSQL
- [x] Gravação de sessões, rondas, palpites e resultados em PostgreSQL
- [x] Recuperação de sessões guardadas a partir do PostgreSQL
- [x] Contador simples de leituras/escritas feitas na base de dados
- [x] Validação do frontend em modo `api` com backend e PostgreSQL em Docker

---

## O que está pendente

- [ ] Avaliar Supabase como hosted quando a gravação em base de dados estiver estável
- [ ] Recolher dados reais de uso e reavaliar Turso/libSQL apenas se o padrão real justificar
- [ ] Expandir o dataset curado para 300 locais reais
- [ ] Rever candidatos Mapillary manualmente e adicionar apenas os que forem adequados
- [ ] Expandir testes automáticos aos fluxos principais do frontend e backend
- [ ] Preparar SignalR para multiplayer/realtime apenas após estabilização do núcleo

---

## Como instalar e correr

### Pré-requisitos

```text
Node.js 20+
Docker
```

### Execução local

```bash
# Frontend
cd src/frontend
npm install
npm run dev
```

```bash
# Backend
dotnet run --project src/backend/backend.csproj
```

```bash
# Frontend ligado à API local
cd src/frontend
npm run dev:api
```

```bash
# Docker
docker compose --profile frontend-mock up
docker compose --profile full up
docker compose --profile database up
```

Se alguma porta já estiver ocupada, posso mudar os valores no `.env`: `FRONTEND_PORT`, `BACKEND_PORT` e `POSTGRES_PORT`. No Docker Compose, o PostgreSQL fica exposto na porta `15432` por omissão para evitar conflito com instalações locais na porta `5432`.

### Acesso

```text
Frontend local: http://localhost:5173
Backend local: http://localhost:8080/api/health
Contador da base de dados: http://localhost:8080/api/diagnostics/database
```

O frontend pode correr em modo `mock` para demonstração rápida ou em modo `api` para testar a ligação ao backend. A base de dados PostgreSQL corre em Docker; o backend já consegue importar o catálogo de locais, guardar sessões, rondas, palpites e resultados, e recuperar sessões guardadas quando as flags de PostgreSQL estão ativas. O perfil `full` já foi validado com frontend em `api`, backend e PostgreSQL no mesmo fluxo.

---

## Decisões de arquitetura principais

| Decisão | Alternativa considerada | Razão da escolha |
|---------|------------------------|-----------------|
| React + TypeScript | Angular | Permite construir rapidamente a interface do jogo e manter uma base de frontend tipada e extensível. |
| ASP.NET Core .NET 8 Minimal API | Outra stack backend | Mantém coerência com a proposta aprovada e fica preparado para a fase seguinte de integração. |
| PostgreSQL em Docker | Supabase completo, Turso/libSQL | Permite guardar dados relacionais de forma reproduzível para desenvolvimento e avaliação; Supabase completo fica para necessidades futuras e Turso só será reavaliado com dados reais de uso. |
| SignalR futuro no backend | Supabase Realtime | O multiplayer terá lógica de jogo, salas, timers, palpites e reconexões; por isso faz mais sentido centralizar realtime no backend ASP.NET Core. |
| Dataset europeu local partilhado | Dependência imediata de APIs externas | Reduz risco técnico e permite preparar um modo `mock` controlado antes da integração final. |
| Docker Compose com perfis | Execução apenas manual | Uniformiza o arranque do frontend, backend e base de dados sem obrigar todos os serviços a correrem sempre em simultâneo. |

Para detalhe adicional, ver [`docs/architecture/adr`]

---

## Referências e IA utilizada

### Referências técnicas

- React
- Vite
- ASP.NET Core .NET 8
- PostgreSQL
- Supabase
- Docker Compose
- OpenStreetMap/Leaflet
- Wikimedia Commons
- Panoramax
- Mapillary

### Ferramentas de IA utilizadas

| Ferramenta | Para que foi usada |
|-----------|-------------------|
| ChatGPT | Apoio na proposta, clarificação da arquitetura, wireframes, planeamento do MVP, estruturação inicial do projeto e criação dos primeiros testes automatizados |
| GitHub Copilot | Apoio pontual no contexto de desenvolvimento e sugestões de código |
| Gemini | Apoio para imagens e logótipos |

### Nota sobre aprendizagem e testes

Usei apoio do ChatGPT sobretudo nas partes em que ainda não me sentia tão à vontade: organização dos testes automatizados em .NET, validação dos contratos entre frontend e backend, verificação do schema SQL e criação de testes que me dão mais segurança quando precisar de alterar classes como `GameSessionService` e `SeedLocationCatalog`.

---

*Última atualização: [15 Maio 2026] · [Pós-relatório intercalar]*
