# Database

Esta pasta contém os ficheiros da camada de dados do projeto.

- `seed/locations.json` é o conjunto de dados inicial partilhado entre o frontend em `mock` e o backend em `api`. Nesta fase já inclui 222 locais reais com dados de fonte/licença validados e 30 locais com Panoramax como fonte adicional.
- `sql/001-init.sql` documenta uma versão legível do esquema base previsto em PostgreSQL.

Nesta parte do MVP, já consigo importar o catálogo de locais para PostgreSQL através de Entity Framework Core. O backend também guarda sessões, rondas, palpites e resultados quando a base de dados está ativa, e consegue recuperar uma sessão guardada quando ela já não está em memória. A base de dados pode ser iniciada isoladamente com o perfil `database`; o perfil `full` arranca frontend em modo API, backend e PostgreSQL.

```bash
docker compose --profile database up
docker compose --profile full up
```

Em execução local fora de Docker, a connection string esperada é:

```text
ConnectionStrings__GeoExplorerDb=Host=localhost;Port=15432;Database=geoexplorer;Username=geoexplorer;Password=geoexplorer_dev
```

Dentro do Docker Compose, o backend usa o host `db` e recebe a connection string por variável de ambiente. A porta externa do PostgreSQL é `15432` por omissão para evitar conflito com uma instalação local na porta `5432`.

Por omissão, a execução local continua a ler `seed/locations.json` e a manter sessões em memória, para facilitar testes rápidos sem base de dados. Quando `GeoExplorer__UsePostgresCatalog=true`, o backend importa o conteúdo do JSON para a tabela `locations` e passa a carregar o catálogo a partir do PostgreSQL. Depois da primeira importação, só volta a escrever locais quando encontra dados novos ou alterados. Quando `GeoExplorer__UsePostgresPersistence=true`, as sessões criadas e rondas resolvidas são guardadas em `game_sessions` e `session_rounds`; se uma sessão não estiver na cache em memória, o backend tenta recuperá-la a partir dessas tabelas.

O schema passou a ser criado pelas migrations do Entity Framework em `src/backend/Data/Migrations`. O ficheiro SQL fica como apoio de leitura, mas já não é montado automaticamente no arranque do PostgreSQL. Se existir um volume antigo criado antes das migrations, o caminho mais simples em desenvolvimento é recriar o volume antes de voltar a arrancar o perfil `full`.

O endpoint `/api/diagnostics/database` devolve um contador simples de leituras e escritas feitas na base de dados. Usei este contador para observar o padrão real durante testes locais e apoiar uma decisão futura sobre PostgreSQL hosted, Supabase ou Turso/libSQL, sem introduzir queries SQL manuais no código da aplicação.

Decidi manter PostgreSQL como base principal e não usar Supabase completo em Docker nesta fase. Supabase fica como hipótese futura se forem necessárias funcionalidades geridas como Auth, Storage, Realtime simples ou Row Level Security. Para multiplayer/realtime do jogo, a direção prevista é SignalR no backend, porque a sincronização terá lógica própria de salas, jogadores, timers, palpites e pontuação.

O campo `sceneImage` continua a suportar as cenas SVG mock como fallback. A secção opcional `media` mantém a fonte visual principal usada pela ronda, guardando URL da imagem, fonte, atribuição, licença, URL da licença, data de verificação e ligação futura a street-level imagery.

Também adicionei `visualSources` para preparar várias fontes visuais por local. No JSON, `media` continua a ser a fonte principal e `visualSources` guarda fontes adicionais, como Panoramax. Quando uma sessão é criada, o backend escolhe uma fonte disponível por ronda, guarda essa escolha em `session_rounds.visual_source` e mantém a mesma fonte se a sessão for recuperada da base de dados. A próxima etapa será continuar a preencher Mapillary/Panoramax quando houver cobertura.
