# ADR-002 — Backend com ASP.NET Core e PostgreSQL

**Data:** 13 de abril de 2026  
**Estado:** Aceite  
**Decisores:** Marcos Monteiro

---

## Contexto

O projeto precisa de uma API para gerir sessões, rondas, palpites, timeout e resultados finais. Também precisa de uma base de dados relacional para persistir sessões e rondas numa fase seguinte, mesmo que a primeira implementação funcional use armazenamento em memória para acelerar o arranque do MVP.

---

## Decisão

Decidi usar ASP.NET Core .NET 8 com Minimal API no backend e PostgreSQL como base de dados principal. Para desenvolvimento e demonstração, a base de dados deve correr em Docker Compose, para que o projeto seja reproduzível sem depender da minha infraestrutura ou de serviços cloud.

O backend mantém temporariamente o estado das partidas em memória enquanto a integração de persistência é feita por etapas. A persistência real deve guardar sessões, rondas, palpites e resultados em PostgreSQL. Se for necessário login, a autenticação deve ficar no backend ASP.NET Core e usar a mesma base de dados, por exemplo com Identity/JWT.

Para realtime e multiplayer futuro, a opção preferencial passa a ser SignalR no backend. Esta escolha encaixa melhor na lógica do jogo, porque o multiplayer do GeoExplorer terá salas, jogadores prontos, rondas, palpites, pontuação, timers, reconnects e sincronização de estado.

---

## Alternativas consideradas

| Alternativa | Razão de rejeição |
|------------|------------------|
| FastAPI | Menor alinhamento com a experiência prévia escolhida para o projeto e menor coerência com a proposta aprovada. |
| Base de dados apenas local em ficheiros | Não prepara de forma adequada a persistência relacional necessária para sessões, rondas e pontuações. |
| Supabase completo em Docker | Acrescenta serviços que ainda não são necessários, porque o projeto já tem backend próprio e precisa inicialmente apenas de PostgreSQL. |
| Supabase Realtime para multiplayer | É útil para atualizações simples baseadas em tabelas, mas não substitui bem a lógica de jogo em tempo real que será necessária. |
| Turso/libSQL | Pode ser reavaliado no futuro se as métricas mostrarem muitas leituras e necessidade de outra distribuição, mas não é a escolha inicial. |

---

## Consequências

**Positivas:**
- O backend fica organizado em torno de contratos claros e facilmente evolutivos.
- PostgreSQL encaixa naturalmente no modelo relacional do projeto.
- Minimal API reduz overhead na primeira fatia vertical.
- Docker Compose torna a base de dados reproduzível para desenvolvimento, testes e avaliação pelos professores.
- SignalR mantém a lógica realtime dentro do backend, em vez de a espalhar por serviços externos.

**Negativas / trade-offs:**
- Exige gerir dois runtimes no desenvolvimento: Node.js e .NET.
- A persistência real em PostgreSQL fica para uma etapa seguinte, criando uma fase transitória com armazenamento em memória.
- A responsabilidade por autenticação e multiplayer fica no backend, o que exige mais implementação própria do que usar um backend-as-a-service completo.

---

## Atualização de 30 de abril de 2026

Depois de comparar Supabase/PostgreSQL, Turso/libSQL e uma solução mais completa com Supabase self-hosted, optei por manter PostgreSQL em Docker como base principal. Achei melhor separar a decisão da base de dados da decisão de serviços geridos: o MVP precisa de persistência relacional estável e reproduzível, não de uma stack completa de backend-as-a-service.

Supabase completo fica como alternativa futura se forem necessárias funcionalidades como Auth gerida, login social, Storage, Realtime simples baseado em tabelas ou Row Level Security. Para multiplayer, a direção escolhida é SignalR, com possível Redis backplane apenas se o backend tiver de escalar para várias instâncias.
