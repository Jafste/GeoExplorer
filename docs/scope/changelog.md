# Changelog

<!-- Uma entrada por semana, até domingo à noite. -->
<!-- Formato fixo: três linhas por entrada. Não elaborar além do necessário. -->
<!-- O changelog é verificado nas três entregas formais. -->

---

## Sem. 1 · 17–24 mar

**Feito:** definição do tema GeoExplorer, delimitação do problema, redação da sinopse e do núcleo do MVP, criação do repositório e estrutura documental inicial.  
**Bloqueou:** decisão final sobre a fonte dos dados geográficos e visuais; não bloqueou a redação da proposta.  
**Próxima semana:** converter a proposta para os templates e preparar os documentos mínimos da Entrega 1: wireframes simples, C4 e modelo de dados.

---

## Sem. 2 · 25 mar–1 abr

**Feito:** consolidei a stack tecnológica, a arquitetura de alto nível, o calendário individual e o preenchimento inicial dos documentos de proposta, requisitos e riscos. Também clarifiquei o modo temporizado opcional e reposicionei o multijogador como objetivo adicional não obrigatório.
**Bloqueou:** escolha final entre dataset totalmente curado e abordagem híbrida com APIs externas, bem como a seleção concreta do fornecedor de mapas.  
**Próxima semana:** concluir wireframes simples, C4 contexto/contentores, modelo de dados e estrutura base de `src/frontend` e `src/backend`.

---

## Sem. 3 · 2–6 abr

**Feito:** concluí os wireframes em duas fases, consolidei a direção visual dos ecrãs principais e organizei os documentos de design e arquitetura para a Entrega 1.
**Bloqueou:** necessidade de alinhar os ficheiros finais com os nomes canónicos esperados pelo template do repositório.  
**Próxima semana:** normalizar os ficheiros principais, rever o README e preparar o arranque técnico do MVP.

---

## Sem. 4 · 7–11 abr

**Feito:** clarifiquei os requisitos do modo temporizado opcional, mantive o multijogador como objetivo adicional, defini o arranque híbrido e preparei a estrutura inicial do frontend com revisão da stack e da direção visual.
**Bloqueou:** necessidade de separar a base visual do frontend do fluxo jogável e da integração backend para manter o histórico incremental coerente.  
**Próxima semana:** configurar a base técnica do frontend, alinhar o README com esse estado inicial e preparar o arranque das páginas do MVP.

---

## Sem. 5 · 14–17 abr

**Feito:** implementei a primeira parte jogável do frontend com React, TypeScript, Vite e Tailwind, incluindo ecrãs de arranque, configuração, ronda, resultados, tutorial local, camada `mock/api` e redesign da ronda com minimapa expansível.
**Bloqueou:** ausência de assets visuais reais para a ronda; nesta fase a experiência usa cenas estilizadas e dataset `mock` para validar o fluxo sem backend.  
**Próxima semana:** iniciar o backend e a gravação em base de dados, rever os fundos visuais mock da ronda e preparar a ligação entre frontend e API.

---

## Sem. 6 · 20–25 abr

**Feito:** arranquei o backend ASP.NET Core com endpoints de sessão, ronda atual, submissão de palpite, timeout e resultados; alinhei o contrato API com o frontend `mock/api`; adicionei Docker Compose com perfis; atualizei o dataset com `sceneImage`; criei o schema SQL inicial e testes mínimos de contrato do backend.
**Bloqueou:** a gravação real em base de dados ainda não estava ligada ao backend; a escolha de alojamento hosted da base de dados ficou para depois de medir chamadas e padrão de leituras/escritas.
**Próxima semana:** estabilizar a ligação frontend + API, preparar demo interna, medir chamadas à base de dados e decidir se sigo com PostgreSQL/Supabase ou se Turso/libSQL merece ADR próprio.

---

## Sem. 7 · 28 abr–2 mai · DEMO INTERNA

**Feito:** adicionei mapa real com OpenStreetMap ao frontend, substituí o minimapa mock nos fluxos principais, integrei 158 locais reais com dados de fonte/licença no dataset, mostrei a atribuição nos resultados e liguei o backend ao PostgreSQL com Entity Framework para guardar catálogo, sessões, rondas, palpites e resultados. Também acrescentei recuperação de sessões guardadas e um contador simples de leituras/escritas da base de dados.
**Bloqueou:** ainda falta testar o fluxo frontend em modo API com PostgreSQL ativo e recolher dados reais durante uma sessão completa.
**Próxima semana:** fechar o fluxo frontend + API com base de dados ativa, observar os dados reais da base de dados e continuar a expansão controlada do dataset para 250-300 locais.

---

## Sem. 8 · 5–6 mai · INTERCALAR

**Feito:** realizei o relatório intercalar com base no modelo do relatório final, atualizei o estado do projeto e registei evidências de frontend, backend, base de dados e testes. Também deixei documentado que o código completo fica no repositório e que o relatório inclui apenas excertos técnicos curtos.
**Bloqueou:** o relatório mostrou que ainda falta testar melhor o fluxo completo com frontend ligado ao backend e PostgreSQL ativo.
**Próxima semana:** rever os textos do repositório, fechar a ligação frontend + API e preparar mais validação técnica.

---

## Sem. 9 · 7–9 mai

**Feito:** revi a documentação do projeto para aproximar o tom do relatório intercalar, usando frases mais pessoais e simples como “fiz”, “adicionei”, “decidi” e “guardei em base de dados”.
**Bloqueou:** ainda há trabalho técnico por fechar antes de crescer mais o projeto, sobretudo o teste ponta a ponta em modo API com base de dados ativa.
**Próxima semana:** continuar a estabilizar o fluxo real do jogo e só depois avançar para mais locais, Mapillary/Panoramax ou multiplayer.

---

## Sem. 10 · 12–16 mai

**Feito:** reduzi escritas desnecessárias no catálogo de locais em PostgreSQL. O backend continua a importar o seed, mas agora só volta a escrever locais quando encontra dados novos ou alterados. Também confirmei o comportamento em Docker ao reiniciar o backend e consultar o diagnóstico da base de dados.
**Bloqueou:** ainda falta fechar o fluxo visual completo no browser com o frontend em modo API.
**Próxima semana:** continuar a fechar o fluxo frontend + API e depois avançar para a expansão controlada do dataset.

---

## Sem. 11 · 19–23 mai

**Feito:**  
**Bloqueou:**  
**Próxima semana:**

---

## Sem. 12 · 26–30 mai

**Feito:**  
**Bloqueou:**  
**Próxima semana:**

---

## Sem. 13 · 2–6 jun

**Feito:**  
**Bloqueou:**  
**Próxima semana:**

---

## Sem. 14 · 9–13 jun

**Feito:**  
**Bloqueou:**  
**Próxima semana:**

---

## Sem. 15 · 16–20 jun · PREP. DEFESA

**Feito:**  
**Bloqueou:**  
**Próxima semana:**

---

## Sem. 16 · 24 jun · ENTREGA FINAL

**Feito:**  
**Bloqueou:** —  
**Próxima semana:** — Defesa pública.
