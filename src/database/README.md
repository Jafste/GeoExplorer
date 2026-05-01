# Database

Esta pasta contém os artefactos da camada de dados do projeto.

- `seed/locations.json` é o dataset inicial partilhado entre o frontend em `mock` e o backend em `api`. Nesta fase já inclui 158 locais reais com metadata visual validada.
- `sql/001-init.sql` documenta o esquema base previsto em PostgreSQL.

Nesta fatia vertical, o catálogo de locais já pode ser importado para PostgreSQL através de Entity Framework Core. O backend também persiste sessões, rondas, palpites e resultados quando a persistência PostgreSQL está ativa, e consegue reconstruir uma sessão guardada quando ela já não está em memória. A base de dados pode ser iniciada isoladamente com o perfil `database`; o perfil `full` arranca frontend em modo API, backend e PostgreSQL.

```bash
docker compose --profile database up
docker compose --profile full up
```

Em execução local fora de Docker, a connection string esperada é:

```text
ConnectionStrings__GeoExplorerDb=Host=localhost;Port=5432;Database=geoexplorer;Username=geoexplorer;Password=geoexplorer_dev
```

Dentro do Docker Compose, o backend usa o host `db` e recebe a connection string por variável de ambiente.

Por omissão, a execução local continua a ler `seed/locations.json` e a manter sessões em memória, para facilitar testes rápidos sem base de dados. Quando `GeoExplorer__UsePostgresCatalog=true`, o backend importa o conteúdo do JSON para a tabela `locations` e passa a carregar o catálogo a partir do PostgreSQL. Quando `GeoExplorer__UsePostgresPersistence=true`, as sessões criadas e rondas resolvidas são guardadas em `game_sessions` e `session_rounds`; se uma sessão não estiver na cache em memória, o backend tenta reconstruí-la a partir dessas tabelas.

Decidi manter PostgreSQL como base principal e não usar Supabase completo em Docker nesta fase. Supabase fica como hipótese futura se forem necessárias funcionalidades geridas como Auth, Storage, Realtime simples ou Row Level Security. Para multiplayer/realtime do jogo, a direção prevista é SignalR no backend, porque a sincronização terá lógica própria de salas, jogadores, timers, palpites e pontuação.

O campo `sceneImage` continua a suportar as cenas SVG mock como fallback. A secção opcional `media` prepara a transição para dados reais, guardando URL da imagem, fonte, atribuição, licença, URL da licença, data de verificação e ligação futura a street-level imagery.

Nesta fase, `media` representa a fonte visual principal de cada local, maioritariamente Wikimedia Commons. Numa fase posterior, pretendo evoluir esta estrutura para várias fontes visuais por local, incluindo Mapillary ou Panoramax quando houver cobertura. A API poderá escolher aleatoriamente uma fonte disponível por ronda, mantendo sempre a licença e a atribuição associadas à imagem efetivamente apresentada.
