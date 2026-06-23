# GeoExplorer

> Plataforma web de jogos de geolocalização para treino em OSINT, com desafios baseados em locais de interesse georreferenciados na Europa.

**Estudante:** Marcos Monteiro · 1902045  
**Orientador:** Pedro Pestana  
**UC:** Projeto de Engenharia Informática · Universidade Aberta · 2025/26  
**Repositório:** https://github.com/Jafste/GeoExplorer

---

## Estado atual

🟢 **Verde** — A proposta foi aprovada e já estruturei os documentos principais da Entrega 1. Também implementei um frontend jogável com mapa real e 10975 locais reais, e o backend em ASP.NET Core já suporta o fluxo principal. Quando as opções de PostgreSQL estão ativas, o projeto já guarda catálogo, sessões, rondas, palpites e resultados em base de dados, incluindo a recuperação de sessões guardadas após reinício do serviço. O catálogo vem de `locations.json` e é sincronizado para PostgreSQL por upsert: IDs novos são inseridos, IDs existentes são atualizados se mudaram e linhas antigas não são apagadas automaticamente para preservar histórico de rondas. Também validei o frontend em modo `api` com backend e PostgreSQL em Docker, passando por criação de sessão, rondas, palpites e relatório final. Preparei várias fontes visuais por local, com 5513 imagens principais Wikimedia Commons, 5462 panoramas 360 Panoramax como locais jogáveis e 1844 fontes Mapillary opcionais resolvidas pelo backend. Depois avancei para uma primeira versão multiplayer com salas por link, dono da sala, nomes únicos por sala, rondas sincronizadas por SignalR e resultados guardados em PostgreSQL. Fiz ainda uma validação limpa do perfil `full` em Docker, com sessão solo, sala multiplayer curta, migrations do Entity Framework e dados confirmados em PostgreSQL. Durante os testes e o feedback que fui recebendo, corrigi problemas de interface, de fluxo e de desempenho; um dos riscos mais claros foi perceber que carregar o catálogo completo de locais no frontend não era sustentável. Por isso, o modo `api` com PostgreSQL passou a ser o caminho real da aplicação, enquanto o modo `mock` ficou apenas como apoio de desenvolvimento. Mantive PostgreSQL em Docker como base principal; Supabase completo fica como hipótese futura e Turso/libSQL só será reavaliado depois de observar dados reais de uso.

---

## O que está implementado

- [x] Proposta de projeto aprovada e documentação de âmbito preenchida
- [x] Wireframes e documentos de arquitetura normalizados para o template
- [x] Frontend inicial com React + TypeScript + Vite
- [x] Sistema visual base com Tailwind e paleta inicial do projeto
- [x] Componentes UI e auxiliares de layout reutilizáveis para a interface
- [x] Fluxo jogável local com ecrãs de início, configuração, ronda, resultado da ronda, relatório final e tutorial
- [x] Camada de dados abstrata com suporte a `mock` e `api`
- [x] Amostra `mock` pequena com locais reais e contratos de jogo alinhados com a API
- [x] Mapa real no frontend com OpenStreetMap/Leaflet
- [x] 10975 locais reais com imagem, fonte, licença e atribuição
- [x] Resultados de ronda com dados de fonte/licença e respetivas ligações
- [x] Campo `visualSources` preparado para várias fontes visuais por local
- [x] 5462 locais Panoramax 360 validados como imagem principal jogável
- [x] Ferramenta local para procurar candidatos Mapillary com token fora do repositório
- [x] Endpoint backend para resolver thumbnails Mapillary com token local
- [x] 1844 locais com fonte adicional Mapillary através do backend
- [x] Escolha de uma fonte visual disponível por ronda com atribuição e licença
- [x] Escolha opcional de países nas sessões solo e multiplayer
- [x] Seleção de rondas que evita locais demasiado próximos na mesma sessão quando há alternativas
- [x] Ferramenta local de verificação para detetar duplicados fortes e textos repetidos no conjunto de locais
- [x] Primeira revisão dos grupos de descrições repetidas no conjunto de locais
- [x] Substituição dos pares de locais demasiado próximos por novos locais reais
- [x] Revisão de dificuldade para remover pistas demasiado diretas e títulos genéricos
- [x] Sinalização de imagens aéreas/panorâmicas e troca dos casos visualmente mais fracos
- [x] Registo das imagens aéreas/panorâmicas já revistas e consideradas úteis para o MVP
- [x] Modo `mock` alinhado com a API para evitar locais demasiado próximos na mesma sessão
- [x] Testes de validação do dataset real e contratos backend/frontend
- [x] Testes de fluxo do modo `mock` com sessão de várias rondas e resultados finais
- [x] Dependências frontend revistas; o `npm audit` ainda aponta vulnerabilidades de desenvolvimento em `esbuild`/`vite`/`vitest` que exigem atualização breaking
- [x] Dockerfile do frontend a usar `package-lock.json` e `npm ci`
- [x] Interface em português
- [x] Execução local do frontend preparada
- [x] Backend inicial ASP.NET Core para sessões, ronda atual, submissão de palpite, timeout e resultados
- [x] Docker Compose com perfis de execução
- [x] Testes mínimos de contrato do backend
- [x] Decisão de arquitetura para PostgreSQL em Docker e SignalR no backend
- [x] Importação do catálogo de locais para PostgreSQL com Entity Framework Core
- [x] Migrations do Entity Framework para criar o schema em PostgreSQL
- [x] Gravação de sessões, rondas, palpites e resultados em PostgreSQL
- [x] Recuperação de sessões guardadas a partir do PostgreSQL
- [x] Contador simples de leituras/escritas feitas na base de dados
- [x] Validação do frontend em modo `api` com backend e PostgreSQL em Docker
- [x] Validação limpa do perfil `full` em Docker com sessão solo e sala multiplayer curta
- [x] Multiplayer inicial com salas por link e nomes únicos por sala
- [x] Salas públicas listáveis, salas por link e password opcional
- [x] Dono da sala a escolher configuração e iniciar a partida
- [x] Rondas multiplayer sincronizadas com SignalR
- [x] Resultado da ronda apenas depois de todos submeterem ou o tempo terminar
- [x] Gravação de salas, jogadores, rondas e palpites multiplayer em PostgreSQL
- [x] Ferramenta local para expandir o dataset com candidatos Wikidata/Wikimedia Commons e metadados de licença
- [x] Ferramenta local para acrescentar locais Panoramax 360 a partir da API pública Panoramax

---

## O que está pendente

- [ ] Avaliar Supabase como hosted quando a gravação em base de dados estiver estável
- [ ] Recolher dados reais de uso e reavaliar Turso/libSQL apenas se o padrão real justificar
- [ ] Continuar a melhorar o conjunto de locais durante testes reais de jogo
- [ ] Continuar a rever candidatos Mapillary/Panoramax quando houver cobertura útil
- [ ] Testar o multiplayer com mais utilizadores e rever casos de reconexão

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
npm run dev
```

```bash
# Docker
docker compose --profile frontend-mock up
docker compose --profile full up
docker compose --profile database up
```

Se alguma porta já estiver ocupada, posso mudar os valores no `.env`: `FRONTEND_PORT`, `BACKEND_PORT` e `POSTGRES_PORT`. No Docker Compose, o PostgreSQL fica exposto na porta `15432` por omissão para evitar conflito com instalações locais na porta `5432`.

O backend aceita CORS apenas para origens configuradas. Por omissão deixei `http://localhost:5173` e `http://127.0.0.1:5173`; se eu expuser o frontend noutro endereço, ajusto `GeoExplorer__AllowedOrigins` no `.env`.

No Dockerfile do frontend usei `npm ci` em vez de `npm install`, porque o Docker deve instalar exatamente as versões registadas no `package-lock.json`. Assim, a instalação fica mais previsível para mim, para os professores e para qualquer ambiente de validação. Continuo a usar `npm install` em desenvolvimento local quando preciso de adicionar ou atualizar dependências.

### Acesso

```text
Versão pública: https://geoexplorer.firmwork.pt/
Frontend local: http://localhost:5173
Backend local: http://localhost:8080/api/health
Verificação completa da API: http://localhost:8080/api/health/details
Contador da base de dados: http://localhost:8080/api/diagnostics/database (só com GeoExplorer__ExposeDatabaseDiagnostics=true)
Thumbnail Mapillary: http://localhost:8080/api/media/mapillary/<id>
Multiplayer: criar sala no frontend em modo `api` e partilhar o URL com `?room=<código>`
```

### Logs técnicos

Inicialmente ainda não tinha uma solução de logs em ficheiro, porque durante os testes locais conseguia acompanhar erros e warnings diretamente pela consola do backend. Quando passei a validar a aplicação na VPS com utilizadores externos, incluindo pessoas próximas como colegas de trabalho e amigos, esse método deixou de ser suficiente: era mais difícil perceber que erros aconteciam em produção, sobretudo em fluxos multiplayer, SignalR e pedidos feitos por outros utilizadores.

Por isso adicionei Serilog para manter logs técnicos do ASP.NET Core, dos serviços internos e do SignalR. Os logs continuam a aparecer na consola, por isso em Docker posso usar:

```bash
docker compose --profile full logs backend
```

Além da consola, o backend escreve ficheiros `.log` rotativos e legíveis:

```text
Execução local: src/backend/logs/geoexplorer-YYYYMMDD.log
Docker Compose: logs/backend/geoexplorer-YYYYMMDD.log
```

Os ficheiros rodam por dia, têm limite de 10 MB por ficheiro e ficam retidos até 14 ficheiros. As pastas de logs estão excluídas do Git. Estes logs são apenas para diagnóstico técnico; métricas de cliques, movimentos e comportamento de utilizadores devem ficar num desenho separado, com atenção a RGPD, finalidade, consentimento e retenção.

### Privacidade e armazenamento local

O projeto não usa cookies próprios, analytics externo ou recolha genérica de cliques/movimentos. Cheguei a considerar uma análise de cliques e comportamento para perceber melhor a utilização, mas antes de implementar essa ideia decidi separar a questão de privacidade. Com apoio do ChatGPT, transformei essa dúvida num documento técnico de privacidade que clarifica o que existe agora e o que teria de ser desenhado antes de recolher métricas futuras. A aplicação usa `localStorage` apenas para dados do próprio jogo: tutorial concluído, opção de mostrar a pontuação total durante a ronda, retoma de sessão solo, identificação local do jogador multiplayer e retoma de sala. O detalhe técnico está em [`docs/privacy.md`](docs/privacy.md).

O frontend corre em modo `api` por omissão; para desenvolvimento isolado posso usar `npm run dev:mock`, que usa uma amostra pequena de locais reais. A base de dados PostgreSQL corre em Docker; o backend já consegue sincronizar o catálogo de locais por upsert a partir de `locations.json`, guardar sessões, rondas, palpites e resultados, e recuperar sessões guardadas quando as flags de PostgreSQL estão ativas. Com o catálogo PostgreSQL ativo, as rondas pedem candidatos aleatórios à tabela `locations`. Validei o perfil `full` com frontend em `api`, backend e PostgreSQL num volume limpo, incluindo uma sessão solo, uma sala multiplayer curta e o diagnóstico técnico da base de dados com a flag própria ativa. Também validei a versão pública em `https://geoexplorer.firmwork.pt/`, com `/api/health` ativo, criação de sala multiplayer e testes com utilizadores externos, incluindo pessoas próximas como colegas de trabalho e amigos. Para Mapillary, o token fica no ambiente local através de `MAPILLARY_ACCESS_TOKEN`; o frontend não recebe essa chave. Também reforcei a validação server-side dos palpites e das salas multiplayer, para não depender apenas da interface.

---

## Decisões de arquitetura principais

| Decisão | Alternativa considerada | Razão da escolha |
|---------|------------------------|-----------------|
| React + TypeScript | Angular | Permite construir rapidamente a interface do jogo e manter uma base de frontend tipada e extensível. |
| ASP.NET Core .NET 8 Minimal API | Outra stack backend | Mantém coerência com a proposta aprovada e fica preparado para a fase seguinte de integração. |
| PostgreSQL em Docker | Supabase completo, Turso/libSQL | Permite guardar dados relacionais de forma reproduzível para desenvolvimento e avaliação; Supabase completo fica para necessidades futuras e Turso só será reavaliado com dados reais de uso. |
| SignalR no backend | Supabase Realtime | O multiplayer tem lógica de jogo, salas, timers, palpites e reconexões; por isso faz mais sentido centralizar realtime no backend ASP.NET Core. |
| Dataset europeu em PostgreSQL, com fallback `mock` pequeno | Catálogo completo carregado no browser ou dependência imediata de APIs externas | Reduz risco técnico, evita enviar um ficheiro pesado de locais para o frontend e mantém uma amostra `mock` controlada para desenvolvimento; Panoramax fica guardado como media real com licença e Mapillary fica opcional através do backend. |
| Docker Compose com perfis | Execução apenas manual | Uniformiza o arranque do frontend, backend e base de dados sem obrigar todos os serviços a correrem sempre em simultâneo. |

Para detalhe adicional, ver:

- [`docs/architecture/c4-context.md`](docs/architecture/c4-context.md)
- [`docs/architecture/c4-containers.md`](docs/architecture/c4-containers.md)
- [`docs/architecture/data-model.md`](docs/architecture/data-model.md)
- [`docs/architecture/game-flows.md`](docs/architecture/game-flows.md)
- [`docs/architecture/visual-sources.md`](docs/architecture/visual-sources.md)
- [`docs/architecture/adr`](docs/architecture/adr)

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
| ChatGPT | Apoio na proposta, clarificação da arquitetura, wireframes, planeamento do MVP, estruturação inicial do projeto, criação dos primeiros testes automatizados, apoio na revisão de problemas encontrados em testes, sugestão/expansão de novos locais e recomendação de ferramentas locais para encontrar fontes e perceber erros do dataset |
| GitHub Copilot | Apoio pontual no contexto de desenvolvimento e sugestões de código |
| Gemini | Apoio na exploração visual do logótipo e de imagens de apoio |

### Nota sobre aprendizagem e testes

Usei apoio do ChatGPT sobretudo nas partes em que ainda não me sentia tão à vontade: organização dos testes automatizados em .NET, validação dos contratos entre frontend e backend, verificação do modelo de dados/migrations EF e criação de testes que me dão mais segurança quando precisar de alterar classes como `GameSessionService` e `SeedLocationCatalog`.

Também usei o ChatGPT para me ajudar a adicionar mais locais às recomendações, depois de perceber nos testes que algumas rondas estavam a repetir locais ou a mostrar escolhas muito parecidas em sessões diferentes.

Na parte do dataset, o ChatGPT também me ajudou a perceber que fazia sentido criar ferramentas locais para procurar candidatos, auditar erros e organizar avisos, em vez de editar milhares de locais apenas manualmente. Depois usei essas ferramentas com revisão manual para decidir o que entrava no projeto.

A direção visual foi inspirada por interfaces táticas de jogos como Call of Duty e 007, sobretudo o verde de alguns Call of Duty mais antigos, misturado com apontamentos neon para criar destaque e leitura rápida na interface.

---

*Última atualização: [12 de junho de 2026] · [Fontes visuais e interface mobile]*
