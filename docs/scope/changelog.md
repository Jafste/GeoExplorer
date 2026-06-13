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
**Bloqueou:** escolha final entre dataset validado manualmente e abordagem híbrida com APIs externas, bem como a seleção concreta do fornecedor de mapas.
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

**Feito:** realizei o relatório intercalar com base no template do relatório final, atualizei o estado do projeto e registei evidências de frontend, backend, base de dados e testes. Também deixei documentado que o código completo fica no repositório e que o relatório inclui apenas excertos técnicos curtos.
**Bloqueou:** o relatório mostrou que ainda falta testar melhor o fluxo completo com frontend ligado ao backend e PostgreSQL ativo.
**Próxima semana:** rever os textos do repositório, fechar a ligação frontend + API e preparar mais validação técnica.

---

## Sem. 9 · 7–9 mai

**Feito:** revi a documentação do projeto para aproximar o tom do relatório intercalar, usando frases mais pessoais e simples como “fiz”, “adicionei”, “decidi” e “guardei em base de dados”.
**Bloqueou:** ainda há trabalho técnico por fechar antes de crescer mais o projeto, sobretudo o teste ponta a ponta em modo API com base de dados ativa.
**Próxima semana:** continuar a estabilizar o fluxo real do jogo e só depois avançar para mais locais, Mapillary/Panoramax ou multiplayer.

---

## Sem. 10 · 12–16 mai

**Feito:** reduzi escritas desnecessárias no catálogo de locais em PostgreSQL. Também validei o frontend em modo `api` com backend e PostgreSQL em Docker, passando por criação de sessão, rondas, palpites, relatório final e diagnóstico da base de dados. Preparei ainda o contrato e a base de dados para guardar várias fontes visuais por local através de `visualSources`, adicionei Panoramax a 30 locais, passei a guardar a fonte visual escolhida por ronda, formalizei o schema com migrations do Entity Framework e reforcei testes de fluxo no backend/frontend.
**Bloqueou:** a validação visual mostrou que o HUD tático podia tapar a zona de submissão em ecrãs de resolução menor, por isso ajustei esse comportamento antes de fechar o teste.
**Próxima semana:** avançar para a expansão controlada do dataset, continuar a preencher Mapillary/Panoramax onde houver cobertura e reforçar os testes dos fluxos principais.

---

## Sem. 11 · 17–23 mai

**Feito:** comecei a expansão seguinte do conjunto de locais e passei de 158 para 300 locais reais. Mantive imagem, coordenadas, fonte, licença e atribuição em cada entrada, e aproveitei para normalizar ligações de licença que não estavam como URL completa. Também acrescentei uma categoria simples para paisagens naturais, aumentei a cobertura Panoramax de 30 para 95 locais e preparei uma ferramenta local para procurar candidatos Mapillary com token fora do repositório. Depois acrescentei um endpoint no backend para resolver thumbnails Mapillary sem expor o token no frontend, ajustei a ferramenta para gerar caminhos estáveis do backend em vez de URLs temporários e adicionei Mapillary a 150 locais. No fim fiz uma primeira verificação de qualidade, corrigi uma imagem repetida, substituí pares demasiado próximos por novos locais reais, revi a dificuldade de vários locais para remover pistas demasiado diretas, títulos genéricos e etiquetas repetidas, e troquei imagens aéreas fracas em Cardiff, Ronda e San Gimignano. Também alinhei a seleção de rondas do modo `mock` com a API, acrescentei testes para sessão mock com várias rondas, corrigi o aviso de segurança do `postcss` e passei o Dockerfile do frontend para `npm ci` com `package-lock.json`. Depois implementei uma primeira versão multiplayer com SignalR: salas por link, nomes únicos por sala, dono da sala a configurar e iniciar, rondas sincronizadas e resultados guardados em PostgreSQL. A seguir acrescentei salas públicas listáveis, password opcional, nome automático editável durante a partida, indicação do meu jogador como `(eu)` e aviso temporário quando alguém está a entrar. Também deixei mais claro o erro de arranque quando existe um volume PostgreSQL antigo sem histórico de migrations.
**Bloqueou:** algumas páginas da Wikimedia não tinham imagem, coordenadas ou dados de licença suficientes, por isso deixei essas entradas de fora em vez de forçar dados incompletos. No Panoramax deixei de fora resultados mais afastados; no Mapillary confirmei que as imagens diretas da API são temporárias, por isso não as gravei no conjunto de locais. A verificação já não encontra pares de locais abaixo do limite definido, pistas que revelem diretamente cidade ou país, textos de dificuldade demasiado repetidos nem imagens aéreas por decidir. As imagens aéreas que ficaram foram revistas manualmente e mantidas quando ajudam a ler melhor o local no jogo.
**Próxima semana:** testar o conjunto de locais e o multiplayer em sessões reais, continuar a preencher Mapillary/Panoramax quando houver cobertura útil e rever casos de reconexão com mais utilizadores.

---

## Sem. 12 · 26–30 mai

**Feito:** aumentei o conjunto de locais de 300 para 1000 entradas reais, mantendo imagem, coordenadas, fonte, licença e atribuição. Também criei uma ferramenta local para procurar candidatos no Wikidata/Wikimedia Commons, recolher metadados em lotes, evitar pontos demasiado próximos, rejeitar labels técnicas visíveis e não guardar imagens aéreas/panorâmicas por rever. Durante a revisão, retirei recintos desportivos fracos, corrigi IDs/cidades que tinham ficado como `Q...` em campos visíveis e variei os textos gerados para reduzir descrições demasiado repetidas.
**Bloqueou:** algumas respostas do Wikidata falharam por timeout ou `502`, e várias imagens do Commons não tinham metadados suficientes para entrar no dataset. Preferi deixar esses candidatos de fora em vez de guardar dados incompletos. A auditoria já não encontra erros bloqueantes, mas ainda pode apontar alguns textos parecidos por causa da geração automática; deixei isso como apoio para revisão manual futura.
**Próxima semana:** testar mais sessões com o dataset maior, rever visualmente uma amostra dos novos locais e continuar a preencher fontes adicionais Mapillary/Panoramax quando houver cobertura útil.

---

## Sem. 13 · 2–6 jun

**Feito:** reforcei a segurança prática do backend antes da validação final: passei o CORS para origens configuradas, documentei `GeoExplorer__AllowedOrigins`, confirmei que o token Mapillary fica só no ambiente local e acrescentei validação server-side para palpites e códigos de salas multiplayer. Também fiz uma validação limpa do perfil `full` em Docker, com PostgreSQL novo, migrations do Entity Framework, sessão solo curta, sala multiplayer curta e confirmação dos dados guardados na base de dados. Depois alinhei a documentação técnica com o estado atual do projeto, incluindo requisitos, riscos, ADRs, documentação da base de dados e diagramas para C4, modelo ER, fluxos de jogo e fontes visuais. Preparei ainda um rascunho para o relatório final, um guião de defesa e capturas finais do jogo.
**Bloqueou:** ainda falta decidir se os ficheiros do relatório entram no Git ou ficam fora do repositório.
**Próxima semana:** passar o rascunho para o documento final, ensaiar a demo e fechar a submissão.

---

## Sem. 14 · 9–13 jun

**Feito:** usei feedback de testes e da versão na VPS para corrigir problemas de navegação, sidebar, topbar, botões, estados de erro, loading e multiplayer. Também revi a criação/listagem de salas, simplifiquei a configuração inicial, tornei as salas públicas com password mais claras e alinhei a interface com componentes reutilizáveis. Identifiquei ainda o risco de carregar o catálogo completo no frontend e consolidei o modo `api` com PostgreSQL como fluxo real, deixando o `mock` como amostra pequena de desenvolvimento. No fim validei a versão pública em `https://geoexplorer.firmwork.pt/`, com `/api/health`, diagnóstico da base de dados e criação de sala multiplayer.
**Bloqueou:** nada bloqueado, fica apenas o cuidado de manter o acesso ao servidor.
**Próxima semana:** fechar o relatório final.

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
