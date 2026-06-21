# Privacidade, dados e armazenamento local

Este documento descreve o comportamento atual do GeoExplorer em matéria de dados técnicos, dados de jogo, armazenamento no browser e cookies. O objetivo é manter a entrega académica transparente e separar o funcionamento necessário da aplicação de funcionalidades futuras de analytics.

> Nota: este documento é uma descrição técnica para o projeto académico e não substitui aconselhamento jurídico.

## Origem desta decisão

Durante a fase final do projeto, considerei adicionar uma análise de cliques, movimentos e outros sinais de utilização para perceber melhor como as pessoas interagiam com a aplicação. Antes de implementar essa ideia, percebi que esse tipo de recolha teria impacto em privacidade, cookies, consentimento e retenção de dados.

Por isso, com apoio do ChatGPT, criei este documento para separar claramente o que a aplicação faz atualmente do que poderia vir a ser uma camada futura de analytics. A decisão atual foi manter apenas dados funcionais do jogo, armazenamento local necessário e logs técnicos de diagnóstico, deixando qualquer análise comportamental para um desenho próprio.

## Estado atual

O GeoExplorer não usa cookies próprios, Google Analytics, Meta Pixel, publicidade, tracking comercial nem recolha genérica de cliques/movimentos do utilizador.

A aplicação usa apenas:

- dados de jogo necessários ao funcionamento das sessões;
- `localStorage` funcional no browser;
- logs técnicos do backend para diagnóstico;
- contador técnico agregado de leituras/escritas da base de dados.

O contador de base de dados é um endpoint de diagnóstico técnico e fica desativado por omissão fora de desenvolvimento local, só sendo exposto quando `GeoExplorer__ExposeDatabaseDiagnostics=true`.

## Dados guardados pelo backend

Quando o PostgreSQL está ativo, o backend guarda dados necessários para o funcionamento do jogo:

- sessões solo criadas;
- rondas associadas a cada sessão;
- palpites submetidos, incluindo coordenadas, distância, pontuação e motivo de resolução;
- salas multiplayer, jogadores da sala, estado da sala, rondas e palpites multiplayer;
- catálogo de locais e fontes visuais usadas nas rondas.

Estes dados existem para permitir criar sessões, recuperar estado, calcular resultados, sincronizar multiplayer e demonstrar o funcionamento persistente do projeto.

## Armazenamento local no browser

A aplicação guarda no `localStorage` alguns dados pequenos do próprio jogo, para não perder estado quando a página é recarregada ou reaberta:

| Chave | Finalidade | Tipo de dado |
| --- | --- | --- |
| `geoexplorer.tutorial.completed` | Guarda se o tutorial inicial já foi fechado. | `true` ou `false`. |
| `geoexplorer.showTotalScoreDuringRound` | Guarda a opção de mostrar a pontuação total durante a ronda. | `true` ou `false`. |
| `geoexplorer.soloSession.resume` | Permite continuar uma sessão solo depois de recarregar ou reabrir a página. | ID da sessão, configuração, ronda atual, pontuação e resultado guardado. |
| `geoexplorer.multiplayer.playerId` | Mantém o mesmo jogador quando entra numa sala multiplayer no mesmo browser. | Identificador aleatório criado pelo frontend. |
| `geoexplorer.multiplayer.roomResume` | Permite voltar a uma sala multiplayer recente. | Código da sala e nome mostrado no jogo. |

Estes dados ficam no browser do utilizador. Não são usados para publicidade, analytics externo ou criação de perfis comerciais.

## Logs técnicos

O backend usa Serilog para logs técnicos. No início, durante os testes locais, bastava acompanhar a consola do backend para perceber erros e warnings. Quando a aplicação passou a ser validada na VPS com utilizadores externos, incluindo pessoas próximas como colegas de trabalho e amigos, ficou mais difícil observar problemas reais apenas pela consola, especialmente em pedidos remotos, SignalR e jogos multiplayer. Por isso, adicionei logs persistentes em ficheiro.

Estes logs servem para diagnóstico, erros, warnings, pedidos HTTP e problemas operacionais.

Localmente, os ficheiros ficam em:

```text
src/backend/logs/geoexplorer-YYYYMMDD.log
```

Em Docker Compose, os ficheiros ficam em:

```text
logs/backend/geoexplorer-YYYYMMDD.log
```

Os ficheiros têm rotação diária, limite de 10 MB por ficheiro e retenção de até 14 ficheiros. As pastas de logs estão excluídas do Git.

Os logs não devem ser usados para guardar comportamento detalhado de navegação, cliques, movimentos ou dados sensíveis.

## Cookies e analytics

No estado atual, não há implementação de cookies próprios nem de cookies de analytics.

Por isso, o projeto não precisa de um banner de cookies para analytics enquanto se mantiver assim:

- sem Google Analytics, Matomo, Hotjar, Microsoft Clarity, Meta Pixel ou ferramentas semelhantes;
- sem cookies ou identificadores persistentes para medir comportamento de utilizadores;
- sem recolha automática de todos os cliques, movimentos ou navegação detalhada.

Se no futuro forem adicionadas métricas de utilização, a implementação deve ser desenhada antes de ser programada. Esse desenho deve definir:

- finalidade concreta das métricas;
- eventos mínimos necessários;
- se os dados são agregados ou associados a identificadores;
- base legal aplicável;
- necessidade de consentimento;
- texto de privacidade/cookies;
- prazo de retenção;
- forma de desativar a recolha quando aplicável.

## Métricas seguras para a entrega académica

Para o relatório final, a opção mais simples e proporcional é usar métricas agregadas derivadas do próprio funcionamento do jogo, sem tracking de cliques:

- número de sessões criadas;
- número de rondas concluídas;
- número de timeouts;
- pontuação média;
- distância média dos palpites;
- número de salas multiplayer criadas;
- número de salas multiplayer concluídas;
- contador técnico de leituras/escritas do endpoint `/api/diagnostics/database`, quando ativado para validação técnica.

Estas métricas ajudam a avaliar o sistema sem criar uma camada de profiling comportamental.

## Referências

- CNPD: [Consentimento](https://www.cnpd.pt/organizacoes/areas-tematicas/consentimento/)
- CNPD: [Nota informativa sobre cookies](https://www.cnpd.pt/media/x2zdus50/nota-informativa-cnpd_cookies_20210625.pdf)
- EDPB: [Cookie Policy](https://www.edpb.europa.eu/concernant-le-cepd/mentions-legales/edpb-cookie-policy_en)
- Comissão Europeia: [Cookies policy](https://commission.europa.eu/cookies-policy_en)
