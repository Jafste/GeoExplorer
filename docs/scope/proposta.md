# Proposta de Projeto

**Título:** GeoExplorer  
**Estudante:** Marcos Monteiro · 1902045  
**Orientador:** Pedro Pestana  
**Data:** 25 de março de 2026  
**Versão:** 1.0

---

## Sinopse

<!-- Três parágrafos máximo. -->
<!-- §1: O problema que o projeto endereça e quem o tem. -->
<!-- §2: A solução proposta e o que a distingue do que já existe. -->
<!-- §3: O resultado esperado e como se verifica que foi atingido. -->
<!-- A sinopse deve ser legível por alguém sem formação técnica. -->

O projeto pretende responder à necessidade de treinar competências de observação, análise visual e inferência geográfica relevantes em contextos de OSINT. A identificação de locais a partir de imagens, padrões urbanos ou características naturais é uma tarefa útil em análise digital, mas o treino deste tipo de capacidade raramente é suportado por ferramentas web estruturadas e orientadas para aprendizagem prática.

A solução proposta consiste numa plataforma interativa de jogos de geolocalização, na qual o utilizador observa uma localização apresentada no ecrã e tenta identificar a sua posição aproximada num mapa interativo. No MVP, os desafios incidirão sobre locais de interesse georreferenciados situados na Europa, selecionados de forma a garantir cobertura suficiente e previsibilidade na demonstração. O sistema calcula depois a distância entre o palpite e a localização real, atribuindo uma pontuação em função da precisão obtida.

Espera-se obter uma aplicação funcional que permita iniciar o jogo, apresentar várias rondas com locais de interesse situados na Europa, recolher palpites num mapa interativo, calcular pontuações e apresentar um resultado final ao utilizador. O sucesso do projeto será verificado através da demonstração funcional do MVP, da validação dos critérios de aceitação definidos e da execução de testes básicos às principais funcionalidades.

---

## MVP — Definição e critérios de aceitação

<!-- Listar as funcionalidades do núcleo mínimo obrigatório na entrega final. -->
<!-- Para cada funcionalidade, definir um critério de aceitação observável. -->
<!-- Exemplo de critério fraco: "o utilizador consegue autenticar-se" -->
<!-- Exemplo de critério forte: "dado email e password válidos, o sistema autentica e redirige para o dashboard -->
<!--   em menos de 2 segundos; dado email inválido, apresenta mensagem de erro sem expor informação de sistema." -->

### Funcionalidade 1 — Início de sessão de jogo

**Critério de aceitação:**  
Dado que o utilizador se encontra na página inicial, quando seleciona a opção de iniciar jogo, o sistema cria uma nova sessão e apresenta o primeiro desafio em menos de 2 segundos.

### Funcionalidade 2 — Configuração da sessão

**Critério de aceitação:**  
Dado que o utilizador se encontra no ecrã de configuração, o sistema permite iniciar uma sessão individual com desafios pertencentes ao âmbito geográfico europeu suportado pelo MVP, escolhendo entre modo sem limite de tempo e modo temporizado.

### Funcionalidade 3 — Modo de jogo baseado em locais de interesse

**Critério de aceitação:**  
Dada uma sessão ativa, o sistema apresenta em cada ronda um desafio visual associado a um local de interesse válido e pertencente ao âmbito geográfico selecionado, mantendo oculta a solução até à submissão da resposta.

### Funcionalidade 4 — Gestão opcional de temporizador por ronda

**Critério de aceitação:**  
Quando a sessão é iniciada em modo temporizado, o sistema apresenta uma contagem decrescente visível em cada ronda e termina ou submete automaticamente a ronda segundo a regra definida quando o tempo expira; quando a sessão é iniciada sem temporizador, a ronda decorre sem limite de tempo.

### Funcionalidade 5 — Submissão de resposta geográfica

**Critério de aceitação:**  
Dada uma ronda em curso, o utilizador consegue submeter uma resposta válida através da interação com o mapa, e o sistema impede múltiplas submissões para a mesma ronda.

### Funcionalidade 6 — Validação da resposta e cálculo de pontuação

**Critério de aceitação:**  
Após a submissão de uma resposta, o sistema calcula a distância à localização correta e atribui automaticamente uma pontuação coerente com a regra definida, sendo essa pontuação tanto maior quanto menor for a distância ao local correto.

### Funcionalidade 7 — Apresentação do resultado da ronda

**Critério de aceitação:**  
Depois da submissão da resposta, o sistema apresenta de forma legível a localização correta, a resposta dada pelo utilizador e a pontuação atribuída, sem necessidade de recarregar manualmente a página.

### Funcionalidade 8 — Resultado final da sessão

**Critério de aceitação:**  
Após a última ronda, o sistema apresenta a pontuação total acumulada, o resumo das rondas jogadas e disponibiliza opções para repetir a sessão com a mesma configuração ou regressar ao ecrã principal para iniciar um novo jogo com diferente configuração.

### Funcionalidade 9 — Registo de resultados

**Critério de aceitação:**  
Quando a sessão termina, o sistema regista em base de dados a identificação da sessão, o âmbito geográfico selecionado, a pontuação final, a data de execução e os dados essenciais das rondas.

### Funcionalidade 10 — Estrutura modular

**Critério de aceitação:**  
No MVP, a aplicação apresenta separação clara entre a lógica de seleção dos desafios, a lógica de temporizador, a lógica de pontuação e o registo de resultados, permitindo adicionar futuramente novos modos ou filtros geográficos sem reestruturar o núcleo principal.

Como objetivo adicional não obrigatório para a versão final do projeto, considera-se a introdução de um modo multijogador, dependente da estabilidade do modo individual e do tempo disponível após conclusão do núcleo principal.

<!-- Adicionar funcionalidades conforme necessário -->

---

## Stack tecnológica

<!-- Para cada tecnologia principal, uma linha de justificação. -->
<!-- Não é necessário ser exaustivo — as decisões menores entram nos ADRs durante o desenvolvimento. -->

| Componente | Tecnologia escolhida | Justificação |
|-----------|---------------------|-------------|
| Frontend | React + TypeScript | Adequa-se bem a uma aplicação web interativa com múltiplos ecrãs, forte componente visual e atualização dinâmica do estado do jogo. |
| Backend | ASP.NET Core .NET 8 Web API | Permite separar a lógica de negócio da interface e criar uma API robusta para sessões, rondas, pontuação e resultados. |
| Base de dados | PostgreSQL | Oferece um modelo relacional sólido para guardar sessões, respostas, rondas e pontuações de forma estruturada. |
| Hosting/Deploy | Execução local com Docker opcional | O foco do MVP é garantir desenvolvimento e demonstração local reprodutíveis; Docker pode uniformizar o ambiente sem aumentar o âmbito obrigatório. |
| Autenticação | Não aplicável no MVP | O MVP é individual e não exige contas de utilizador, evitando complexidade desnecessária nesta fase inicial. |

---

## Esboço de arquitetura — C4 Nível 1

<!-- Opcional mas recomendado se já houver clareza sobre a fronteira do sistema. -->
<!-- Pode ser uma imagem, um diagrama em texto, ou uma descrição estruturada. -->
<!-- Vai ser refinado em docs/architecture/c4-context.png durante o desenvolvimento. -->

**Sistema:** GeoExplorer

**Utilizadores:**
- Jogador individual — inicia sessões, responde a desafios num mapa interativo e consulta resultados por ronda e resultado final.

**Sistemas externos:**
- Serviço de mapas base — fornece cartografia e interação de mapa para recolha do palpite do utilizador.
- Fontes de dados geográficos e visuais — suportam a recolha e preparação do dataset curado usado pelo MVP.

---

## Calendário individual detalhado

<!-- Adaptar o template do Guia de Projeto ao projeto específico. -->
<!-- As datas das três entregas formais são fixas. O restante é do estudante gerir. -->
<!-- Ser realista: prever tempo para testes, revisão do relatório e preparação da defesa. -->

| Semanas | Datas | Conteúdo planeado | Marco |
|---------|-------|------------------|-------|
| Sem. 1–2 | 17–28 mar | Definição do tema, redação da proposta, configuração do repositório e preenchimento inicial da documentação de âmbito. | **Proposta (25 mar)** |
| Sem. 3–4 | 31 mar–11 abr | Completar os artefactos mínimos da Entrega 1: wireframes simples da interface, C4 contexto, C4 contentores, modelo de dados e estrutura base do projeto. | |
| Sem. 5–6 | 14–25 abr | Implementar o MVP mínimo jogável: iniciar sessão, configurar modo com ou sem temporizador, apresentar ronda, submeter palpite, calcular pontuação e registar resultados com um dataset europeu controlado. | |
| Sem. 7 | 28 abr–2 mai | Integrar frontend, API e base de dados numa versão jogável ponta a ponta e ensaiar a demo interna. | **Demo interna** |
| Sem. 8 | 5–6 mai | Corrigir falhas detetadas, consolidar documentação e preparar a entrega intercalar. | **Intercalar (6 mai)** |
| Sem. 9–10 | 7–16 mai | Melhorar UX das rondas e do resultado final. Reforçar regras de pontuação, consistência do registo de resultados, estabilidade da aplicação e consolidar o modo temporizado. | |
| Sem. 11–12 | 19–30 mai | Expandir e validar o dataset, adicionar testes básicos aos fluxos principais e estabilizar integração. | |
| Sem. 13 | 2–6 jun | Implementar melhorias não críticas, reduzir dívida técnica, rever o cumprimento dos critérios de aceitação e avaliar a inclusão de um modo multijogador simples se o núcleo estiver estável. | |
| Sem. 14 | 9–13 jun | Congelar funcionalidades, rever documentação final, atualizar diagramas e preparar versão candidata à entrega. | |
| Sem. 15 | 16–20 jun | Preparar defesa, validar instalação e demonstração e ensaiar a apresentação final. | **Prep. defesa** |
| Sem. 16 | 24 jun | Submissão do relatório final. | **Final (24 jun)** |
