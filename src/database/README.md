# Database

Esta pasta contém os ficheiros da camada de dados do projeto.

- `seed/locations.json` é o conjunto de dados inicial partilhado entre o frontend em `mock` e o backend em `api`. Nesta fase já inclui 158 locais reais com dados de fonte/licença validados.
- `sql/001-init.sql` documenta o esquema base previsto em PostgreSQL.

Nesta parte do MVP, já consigo importar o catálogo de locais para PostgreSQL através de Entity Framework Core. O backend também guarda sessões, rondas, palpites e resultados quando a base de dados está ativa, e consegue recuperar uma sessão guardada quando ela já não está em memória. A base de dados pode ser iniciada isoladamente com o perfil `database`; o perfil `full` arranca frontend em modo API, backend e PostgreSQL.

```bash
docker compose --profile database up
docker compose --profile full up
```

Em execução local fora de Docker, a connection string esperada é:

```text
ConnectionStrings__GeoExplorerDb=Host=localhost;Port=5432;Database=geoexplorer;Username=geoexplorer;Password=geoexplorer_dev
```

Dentro do Docker Compose, o backend usa o host `db` e recebe a connection string por variável de ambiente.

Por omissão, a execução local continua a ler `seed/locations.json` e a manter sessões em memória, para facilitar testes rápidos sem base de dados. Quando `GeoExplorer__UsePostgresCatalog=true`, o backend importa o conteúdo do JSON para a tabela `locations` e passa a carregar o catálogo a partir do PostgreSQL. Depois da primeira importação, só volta a escrever locais quando encontra dados novos ou alterados. Quando `GeoExplorer__UsePostgresPersistence=true`, as sessões criadas e rondas resolvidas são guardadas em `game_sessions` e `session_rounds`; se uma sessão não estiver na cache em memória, o backend tenta recuperá-la a partir dessas tabelas.

O endpoint `/api/diagnostics/database` devolve um contador simples de leituras e escritas feitas na base de dados. Usei este contador para observar o padrão real durante testes locais e apoiar uma decisão futura sobre PostgreSQL hosted, Supabase ou Turso/libSQL, sem introduzir queries SQL manuais no código da aplicação.

Decidi manter PostgreSQL como base principal e não usar Supabase completo em Docker nesta fase. Supabase fica como hipótese futura se forem necessárias funcionalidades geridas como Auth, Storage, Realtime simples ou Row Level Security. Para multiplayer/realtime do jogo, a direção prevista é SignalR no backend, porque a sincronização terá lógica própria de salas, jogadores, timers, palpites e pontuação.

O campo `sceneImage` continua a suportar as cenas SVG mock como fallback. A secção opcional `media` mantém a fonte visual principal usada pela ronda, guardando URL da imagem, fonte, atribuição, licença, URL da licença, data de verificação e ligação futura a street-level imagery.

Também adicionei `visualSources` para preparar várias fontes visuais por local. Por agora, quando esta lista não existe no JSON, o backend usa `media` como única fonte visual. A próxima etapa será preencher alguns locais com Wikimedia Commons e Mapillary/Panoramax quando houver cobertura, e só depois escolher aleatoriamente uma fonte disponível por ronda mantendo sempre a licença e a atribuição associadas à imagem apresentada.
