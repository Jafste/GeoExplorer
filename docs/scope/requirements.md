# Levantamento de Requisitos

**Projeto:** GeoExplorer  
**Versão:** 1.1 · 26 de março de 2026  
**Referência MoSCoW:** https://www.productplan.com/glossary/moscow-prioritization/

---

## Método MoSCoW

| Categoria | Significado |
|-----------|------------|
| **Must have** | Obrigatório. Sem isto o projeto não é entregável. |
| **Should have** | Importante mas não crítico. Incluir se o tempo permitir. |
| **Could have** | Desejável. Só se tudo o resto estiver concluído. |
| **Won't have** | Explicitamente fora do âmbito desta versão. |

---

## Requisitos funcionais

<!-- O que o sistema faz. -->

### Must have

- RF01 — O sistema deve permitir iniciar uma nova sessão de jogo individual a partir da página principal.
- RF02 — O sistema deve permitir configurar a sessão no âmbito geográfico europeu suportado pelo MVP, escolhendo entre modo com tempo e modo sem tempo.
- RF03 — O sistema deve apresentar desafios visuais por rondas com locais de interesse georreferenciados válidos.
- RF04 — Quando a sessão é iniciada em modo temporizado, o sistema deve apresentar uma contagem decrescente visível e aplicar a regra definida quando o tempo termina; quando a sessão é iniciada sem temporizador, a ronda decorre sem limite de tempo.
- RF05 — O utilizador deve poder submeter um palpite geográfico através do mapa interativo, uma única vez por ronda.
- RF06 — O sistema deve calcular a distância ao local correto e atribuir a pontuação correspondente após cada submissão.
- RF07 — O sistema deve apresentar o resultado de cada ronda com localização correta, resposta submetida e pontuação obtida.
- RF08 — O sistema deve apresentar um resultado final da sessão com pontuação acumulada e resumo das rondas jogadas.
- RF09 — O sistema deve registar em base de dados os dados essenciais da sessão e das respetivas rondas, incluindo o modo de jogo com ou sem temporizador.

### Should have

- RF10 — O sistema deve permitir repetir a sessão com a mesma configuração após a apresentação do resultado final.
- RF11 — A aplicação deve manter separação clara entre seleção de desafios, temporizador, cálculo de pontuação e persistência para suportar evolução futura.

### Could have

- RF12 — O sistema poderá suportar um modo multijogador simples, permitindo comparar pontuações entre vários jogadores na mesma sessão ou em sessões equivalentes.
- RF13 — O sistema poderá suportar filtros adicionais dentro do âmbito europeu, como país ou categoria de local, sem alterar o núcleo do jogo.
- RF14 — O sistema poderá apresentar estatísticas básicas por sessão para apoio à análise do desempenho.

### Won't have (nesta versão)

- RF15 — Cobertura geográfica global, por introduzir dependência excessiva de dados e maior risco para a demonstração.
- RF16 — Autenticação e contas de utilizador, por não serem necessárias para o MVP individual definido na proposta.

---

## Requisitos não-funcionais

<!-- Como o sistema se comporta: performance, segurança, usabilidade, escalabilidade. -->

### Must have

- RNF01 — **Performance:** criação de nova sessão e carregamento de cada ronda em menos de 2 segundos em ambiente normal de desenvolvimento/demonstração.
- RNF02 — **Segurança:** validação server-side das submissões e ausência de segredos, credenciais ou chaves reais no repositório.
- RNF03 — **Usabilidade:** interface utilizável sem formação prévia, com navegação clara entre início, ronda, resultado da ronda e resultado final.
- RNF04 — **Integridade dos dados:** cada ronda aceita uma única submissão válida e cada sessão persiste dados coerentes de pontuação total e rondas jogadas.

### Should have

- RNF05 — **Manutenibilidade:** arquitetura modular com separação entre frontend, API, persistência e lógica de pontuação, permitindo evolução sem refatorização significativa.
- RNF06 — **Testabilidade:** existência de testes básicos aos fluxos principais do jogo, ao cálculo de distância/pontuação e ao registo de resultados.

### Could have

- RNF07 — **Portabilidade:** execução reprodutível em ambiente local documentado, com possibilidade de apoio por Docker se necessário.

---

## Histórico de alterações

| Versão | Data | Alteração | Razão |
|--------|------|-----------|-------|
| 1.0 | 25 de março de 2026 | Versão inicial | Proposta de projeto |
| 1.1 | 26 de março de 2026 | Clarificação do modo temporizado opcional e reposicionamento do multijogador como objetivo adicional não obrigatório | Ajuste do âmbito funcional |
