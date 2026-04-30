# Changelog

<!-- Uma entrada por semana, até domingo à noite. -->
<!-- Formato fixo: três linhas por entrada. Não elaborar além do necessário. -->
<!-- O changelog é verificado nas três entregas formais. -->

---

## Sem. 1 · 17–24 mar

**Feito:** definição do tema GeoExplorer, delimitação do problema, redação da sinopse e do núcleo do MVP, criação do repositório e estrutura documental inicial.  
**Bloqueou:** decisão final sobre a fonte dos dados geográficos e visuais; não bloqueou a redação da proposta.  
**Próxima semana:** converter a proposta para os templates e preparar os artefactos mínimos da Entrega 1: wireframes simples, C4 e modelo de dados.

---

## Sem. 2 · 25 mar–1 abr

**Feito:** consolidação da stack tecnológica, da arquitetura de alto nível, do calendário individual e preenchimento inicial dos documentos de proposta, requisitos e riscos, incluindo a clarificação do modo temporizado opcional e do multijogador como objetivo adicional não obrigatório.  
**Bloqueou:** escolha final entre dataset totalmente curado e abordagem híbrida com APIs externas, bem como a seleção concreta do fornecedor de mapas.  
**Próxima semana:** concluir wireframes simples, C4 contexto/contentores, modelo de dados e estrutura base de `src/frontend` e `src/backend`.

---

## Sem. 3 · 2–6 abr

**Feito:** conclusão dos wireframes em duas fases, consolidação visual dos ecrãs principais e estabilização dos artefactos de design e arquitetura para a Entrega 1.  
**Bloqueou:** necessidade de alinhar os ficheiros finais com os nomes canónicos esperados pelo template do repositório.  
**Próxima semana:** normalizar os artefactos canónicos, rever o README e preparar o arranque técnico do MVP.

---

## Sem. 4 · 7–11 abr

**Feito:** clarificação dos requisitos do modo temporizado opcional, reposicionamento do multijogador como objetivo adicional, definição do arranque híbrido e preparação da estrutura inicial do frontend com revisão da stack e da direção visual.  
**Bloqueou:** necessidade de separar a base visual do frontend do fluxo jogável e da integração backend para manter o histórico incremental coerente.  
**Próxima semana:** configurar a base técnica do frontend, alinhar o README com esse estado inicial e preparar o arranque das páginas do MVP.

---

## Sem. 5 · 14–17 abr

**Feito:** implementação da primeira fatia jogável do frontend com React, TypeScript, Vite e Tailwind, incluindo ecrãs de arranque, configuração, ronda, resultados, tutorial local, camada `mock/api` e redesign da ronda com minimapa expansível.  
**Bloqueou:** ausência de assets visuais reais para a ronda; nesta fase a experiência usa cenas estilizadas e dataset `mock` para validar o fluxo sem backend.  
**Próxima semana:** iniciar o backend e a persistência, rever os fundos visuais mock da ronda e preparar a integração entre frontend e API.

---

## Sem. 6 · 20–25 abr

**Feito:** arranque do backend ASP.NET Core com endpoints de sessão, ronda atual, submissão de palpite, timeout e resultados; alinhamento do contrato API com o frontend `mock/api`; adição de Docker Compose com perfis; atualização do dataset com `sceneImage`; criação do schema SQL inicial e testes mínimos de contrato do backend.  
**Bloqueou:** a persistência real ainda não está ligada ao backend; a escolha de alojamento hosted da base de dados será reavaliada depois de medir chamadas e padrão de leituras/escritas.  
**Próxima semana:** estabilizar integração frontend + API, preparar demo interna, medir chamadas à camada de dados e decidir se a persistência segue diretamente para PostgreSQL/Supabase ou se Turso/libSQL merece ADR próprio.

---

## Sem. 7 · 28 abr–2 mai · DEMO INTERNA

**Feito:** adicionei mapa real com OpenStreetMap ao frontend, substituí o minimapa mock nos fluxos principais, integrei 158 locais reais com metadata de fonte/licença no dataset e mostrei a atribuição nos resultados. Também documentei a evolução futura para várias fontes visuais por local, incluindo Wikimedia Commons e Mapillary/Panoramax, e reforcei testes para validar contratos backend/frontend e metadata visual dos locais.
**Bloqueou:** ainda não liguei a persistência real ao backend; a base de dados continua preparada, mas as sessões ainda correm em memória.
**Próxima semana:** estabilizar o modo `api`, medir chamadas à camada de dados, continuar a expansão do dataset para 250-300 locais e decidir se mantenho PostgreSQL/Supabase nesta fase ou se vale a pena preparar uma alternativa como Turso/libSQL.

---

## Sem. 8 · 5–6 mai · INTERCALAR

**Feito:**  
**Bloqueou:**  
**Próxima semana:**

---

## Sem. 9 · 7–9 mai

**Feito:**  
**Bloqueou:**  
**Próxima semana:**

---

## Sem. 10 · 12–16 mai

**Feito:**  
**Bloqueou:**  
**Próxima semana:**

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
