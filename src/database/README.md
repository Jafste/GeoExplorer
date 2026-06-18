# Database
Esta pasta contém os ficheiros da camada de dados do projeto.

- `seed/locations.json` é o conjunto de dados controlado do catálogo real e serve como seed/fallback do backend. O frontend em `mock` usa apenas uma amostra pequena de locais reais para não empacotar o dataset completo. Nesta fase o seed já inclui 10975 locais reais com dados de fonte/licença validados: 5513 com imagem principal Wikimedia Commons, 5462 com panorama 360 Panoramax como imagem principal jogável e 1844 com Mapillary como fonte visual adicional.

Usei o ChatGPT como apoio para pensar nesta parte do trabalho, sobretudo para recomendar a criação de ferramentas locais que me ajudassem a encontrar mais locais/fontes visuais e a perceber erros ou avisos durante as auditorias do dataset. As ferramentas não substituíram a revisão manual: serviram para acelerar a recolha, organizar candidatos e chamar a atenção para problemas como dados em falta, imagens repetidas, locais demasiado próximos ou fontes visuais fracas.

Nesta parte do MVP, já consigo sincronizar o catálogo de locais para PostgreSQL através de Entity Framework Core. O backend também guarda sessões, rondas, palpites e resultados quando a base de dados está ativa, e consegue recuperar uma sessão guardada quando ela já não está em memória. A primeira versão multiplayer também guarda salas, jogadores, rondas e palpites em PostgreSQL. As salas podem ser privadas por link ou públicas na lista de salas abertas; se tiverem password, o backend guarda apenas o hash da password. A base de dados pode ser iniciada isoladamente com o perfil `database`; o perfil `full` arranca frontend em modo API, backend e PostgreSQL.

```bash
docker compose --profile database up
docker compose --profile full up
```

Em execução local fora de Docker, a connection string esperada é:

```text
ConnectionStrings__GeoExplorerDb=Host=localhost;Port=15432;Database=geoexplorer;Username=geoexplorer;Password=geoexplorer_dev
```

Dentro do Docker Compose, o backend usa o host `db` e recebe a connection string por variável de ambiente. A porta externa do PostgreSQL é `15432` por omissão para evitar conflito com uma instalação local na porta `5432`.

No perfil completo, `GeoExplorer__UsePostgresCatalog=true` faz o backend sincronizar `seed/locations.json` para a tabela `locations` no arranque do serviço. A sincronização é um upsert idempotente feito pelo Entity Framework: se o `id` já existe, o backend compara os campos e atualiza só quando há alterações; se o `id` ainda não existe, insere uma nova linha. Locais que já estão na base de dados mas saíram do JSON não são apagados automaticamente, para não partir histórico de `session_rounds` ou `multiplayer_rounds`. Em runtime, as rondas solo e multiplayer pedem candidatos aleatórios ao PostgreSQL, em vez de dependerem do dataset completo no bundle do frontend ou de uma seleção feita sempre sobre o catálogo inteiro em memória. Quando `GeoExplorer__UsePostgresPersistence=true`, as sessões criadas e rondas resolvidas são guardadas em `game_sessions` e `session_rounds`; se uma sessão não estiver na cache em memória, o backend tenta recuperá-la a partir dessas tabelas. No multiplayer, a mesma flag ativa a gravação de `multiplayer_rooms`, `multiplayer_players`, `multiplayer_rounds` e `multiplayer_guesses`.

## Tabelas principais

| Tabela | Para que serve |
|--------|----------------|
| `locations` | Catálogo de locais reais, coordenadas, imagem principal, licenças, pistas e fontes visuais adicionais. |
| `game_sessions` | Sessões solo criadas pelo jogador. |
| `session_rounds` | Rondas de sessões solo, incluindo local escolhido, fonte visual usada, palpite, distância e pontuação. |
| `multiplayer_rooms` | Salas multiplayer, código da sala, configuração, estado, visibilidade e hash da password quando existe. |
| `multiplayer_players` | Jogadores dentro de cada sala, nome visível, dono da sala, estado de ligação e pontuação total. |
| `multiplayer_rounds` | Rondas multiplayer sincronizadas para todos os jogadores da sala. |
| `multiplayer_guesses` | Palpites de cada jogador numa ronda multiplayer. |

O modelo ER atualizado está em `docs/architecture/data-model.md`.

O schema é criado pelas migrations do Entity Framework em `src/backend/Data/Migrations`. Validei o perfil `full` com um volume limpo: as migrations foram aplicadas, o catálogo foi importado e ficaram gravadas uma sessão solo e uma sala multiplayer curta. Se existir um volume antigo criado antes das migrations, o backend pode encontrar tabelas como `game_sessions` sem histórico EF e falhar com `relation already exists`. Nesse caso, como é ambiente de desenvolvimento, o caminho mais simples é recriar o volume antes de voltar a arrancar o perfil `full`:

```bash
docker compose --profile full down -v
docker compose --profile full up --build
```

O endpoint `/api/diagnostics/database` só fica ativo quando `GeoExplorer__ExposeDatabaseDiagnostics=true`. No `docker-compose`, fica desligado por omissão. Usei este contador para observar o padrão real durante testes locais e apoiar uma decisão futura sobre PostgreSQL hosted, Supabase ou Turso/libSQL, sem introduzir queries SQL manuais no código da aplicação.

Decidi manter PostgreSQL como base principal e não usar Supabase completo em Docker nesta fase. Supabase fica como hipótese futura se forem necessárias funcionalidades geridas como Auth, Storage, Realtime simples ou Row Level Security. Para multiplayer/realtime do jogo, implementei SignalR no backend, porque a sincronização tem lógica própria de salas, jogadores, timers, palpites e pontuação.

O campo `sceneImage` continua a suportar as cenas SVG mock como alternativa. A secção opcional `media` mantém a fonte visual principal usada pela ronda, guardando URL da imagem, fonte, atribuição, licença, URL da licença, data de verificação e ligação futura a imagens ao nível da rua.

Também adicionei `visualSources` para preparar várias fontes visuais por local. No JSON, `media` continua a ser a fonte principal e `visualSources` guarda fontes adicionais ou a mesma fonte jogável quando convém manter o contrato uniforme. Quando uma sessão é criada, o backend escolhe uma fonte disponível por ronda, guarda essa escolha em `session_rounds.visual_source` e mantém a mesma fonte se a sessão for recuperada da base de dados. Panoramax 360 já pode entrar como imagem principal jogável; Mapillary continua opcional porque depende de token no backend.

## Recolha de candidatos Mapillary

Mapillary fica como fonte visual adicional e não como dependência obrigatória do jogo. Para procurar candidatos junto dos locais já existentes, posso usar:

```bash
MAPILLARY_ACCESS_TOKEN=... node src/database/tools/find-mapillary-sources.mjs \
  --max-results 25 \
  --max-distance-meters 50 \
  --output /tmp/geoexplorer-mapillary-candidates.json
```

O script apenas gera candidatos. Não altera `seed/locations.json`. Antes de copiar qualquer entrada para `visualSources`, devo confirmar manualmente se a imagem corresponde ao local, se a distância é aceitável e se a atribuição e a licença estão preenchidas. A chave `MAPILLARY_ACCESS_TOKEN` deve ficar apenas no ambiente local ou num `.env` privado.

Quando um candidato Mapillary for aprovado, não devo guardar o `thumb_1024_url` devolvido pela API no dataset, porque é temporário. Por isso, o script já coloca em `imageUrl` um caminho estável do backend, como `/api/media/mapillary/<id-da-imagem>`. O backend usa o token local para resolver o thumbnail no momento certo e devolve um redirect para a imagem atual.

## Expansão Panoramax 360

Para acrescentar panoramas 360 reais a partir da API pública Panoramax, posso usar:

```bash
node src/database/tools/add-panoramax-locations.mjs --target <total-panoramax> --write
```

A ferramenta procura em grelhas de várias áreas europeias, filtra candidatos com metadados de panorama 360/equiretangular ou proporção aproximada 2:1, evita imagens repetidas e rejeita pontos demasiado próximos dos locais existentes. As entradas Panoramax usam licença `CC BY-SA 4.0`, guardam a imagem estável devolvida pela API e mantêm a ligação STAC original em `imageSourceUrl`.

O expansor também lê, por omissão, `docs/scope/image-quality-audit.json` e `docs/scope/image-quality-blocklist.json` para não voltar a adicionar imagens já rejeitadas por baixa qualidade ou erro HTTP. Se for preciso repor poucos locais depois de uma limpeza, posso relaxar a distância mínima sem repetir imagens:

```bash
node src/database/tools/add-panoramax-locations.mjs \
  --target 4 \
  --min-distance-meters 40 \
  --max-per-area 1 \
  --write
```

## Auditoria de qualidade de imagem

Para detetar imagens muito desfocadas, escuras, lavadas, com pouco contraste ou quebradas em Mapillary/Panoramax:

```bash
node src/database/tools/audit-image-quality.mjs \
  --providers Mapillary,Panoramax \
  --report docs/scope/image-quality-audit.json
```

Para aplicar apenas as remoções high-confidence e atualizar a blacklist persistente:

```bash
node src/database/tools/audit-image-quality.mjs \
  --providers Mapillary,Panoramax \
  --report docs/scope/image-quality-audit.json \
  --write \
  --remove-errors
```

O relatório separa `remove`, `error` e `review`. A lista `review` deve ser vista manualmente antes de apagar, porque panoramas 360 podem ter zonas distorcidas/menos nítidas mas continuar jogáveis quando o jogador roda a imagem.

## Verificação do dataset

Para rever o dataset sem alterar ficheiros, posso correr:

```bash
node src/database/tools/audit-location-dataset.mjs --fail-on-errors
```

Este script mostra contagens por país e fonte visual, deteta IDs duplicados, imagens principais repetidas, dados obrigatórios em falta, locais muito próximos, textos demasiado repetidos, pistas que revelam diretamente cidade ou país e imagens que parecem ser aéreas ou panorâmicas. Usei esta verificação para corrigir uma imagem repetida em Kotor, substituir pares demasiado próximos por novos locais reais, melhorar descrições demasiado parecidas e trocar imagens fracas em Cardiff, Ronda e San Gimignano. Neste momento, a verificação já não encontra erros bloqueantes como pistas diretas nos textos jogáveis, imagens aéreas por decidir, imagens principais repetidas nem metadados obrigatórios em falta. Os avisos de proximidade/texto repetido ficam como apoio para revisão manual futura, sobretudo depois de reposições pontuais de panoramas 360.

Além desta revisão do conjunto de locais, o backend tenta não escolher locais a menos de 1 km entre si dentro da mesma sessão quando existem alternativas suficientes no catálogo.

## Expansão Wikimedia

Para aumentar o conjunto de locais sem introduzir dados sem licença, posso usar a ferramenta local:

```bash
node src/database/tools/expand-wikimedia-locations.mjs --target-count <total-wikimedia>
```

A ferramenta procura candidatos no Wikidata, recolhe metadados de imagem no Wikimedia Commons, evita imagens principais repetidas, pontos demasiado próximos, labels técnicas visíveis e ficheiros que parecem ser imagens aéreas/panorâmicas por rever. Também limita quantos locais entram por país em cada passe, para evitar que o dataset fique concentrado num conjunto pequeno de países.

Depois de expandir, corro sempre a auditoria do dataset. Nesta fase a auditoria já não encontrou erros bloqueantes, mas ainda pode assinalar alguns textos parecidos por causa da geração automática de descrições; esses avisos ficam como apoio para revisões manuais futuras.
