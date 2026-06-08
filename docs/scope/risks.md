# Gestão de Riscos

**Projeto:** GeoExplorer  
**Versão:** 1.6 · 8 de junho de 2026

---

## Tabela de riscos

<!-- Identificar 3 a 5 riscos reais ao projeto. -->
<!-- Probabilidade: Alta / Média / Baixa -->
<!-- Impacto: Alto / Médio / Baixo -->
<!-- Mitigação: o que se faz para reduzir probabilidade ou impacto -->

| ID | Risco | Probabilidade | Impacto | Mitigação |
|----|-------|--------------|---------|-----------|
| R01 | Deriva de âmbito para múltiplos modos de jogo, multijogador ou autenticação antes de o MVP estar estável | Média | Alto | Manter o MVP contratualizado em `docs/scope/requirements.md`; qualquer extensão fica classificada como `Should`, `Could` ou `Won't have`. |
| R02 | Dependência excessiva de APIs externas para imagens, localizações ou mapas durante a demonstração | Média | Alto | Preparar um conjunto de locais revisto para o MVP e usar serviços externos apenas como apoio à recolha/preparação dos dados. |
| R03 | Dataset europeu insuficiente, inconsistente ou com dúvidas de licenciamento | Baixa | Alto | Manter o conjunto atual de 1000 locais com origem documentada, coordenadas, licença, atribuição e verificação automática de duplicados, proximidade e pistas demasiado diretas. |
| R04 | Subestimação da complexidade de ligar frontend com mapa, API .NET e base de dados | Baixa | Médio | Implementei e validei uma parte jogável de ponta a ponta com frontend em `api`, backend e PostgreSQL em Docker. |
| R05 | Falta de tempo para testes, diagramas, relatório e preparação da defesa | Média | Médio | Reservar semanas específicas para estabilização e documentação e evitar concentrar trabalho apenas perto das entregas formais. |
| R06 | Divergência entre o comportamento do frontend em `mock` e a API real | Baixa | Médio | Definir contratos comuns para `mock` e `api`, reutilizar o mesmo dataset inicial, alinhar regras de seleção de rondas e manter testes de fluxo para ambos os modos principais. |
| R07 | Complexidade adicional de execução com Docker em paralelo com execução local | Baixa | Médio | Usar Compose com perfis simples, `.env.example` documentado e validação limpa do perfil `full` com frontend, backend e PostgreSQL. |
| R08 | O plano gratuito de um fornecedor hosted como Supabase pode não ser suficiente para testes reais em live, por limites de armazenamento, tráfego, leituras, escritas ou pausas de serviço | Média | Médio | Manter PostgreSQL local via Docker como ambiente reprodutível, medir chamadas durante testes, evitar dependência exclusiva de um fornecedor gratuito e preparar alternativa hosted apenas se for necessária. |
| R09 | O uso real pode mostrar mais leituras à base de dados do que eu previa no início | Média | Médio | Registar chamadas importantes à base de dados, guardar em cache dados estáveis como o catálogo de locais e reavaliar Turso/libSQL apenas com dados reais. |
| R10 | Uma mudança tardia de PostgreSQL para Turso/libSQL pode exigir ajustes no schema, nos tipos de dados e no código que guarda informação | Baixa | Médio | Isolar o acesso à base de dados em serviços próprios, evitar SQL específico do fornecedor sempre que possível e documentar qualquer mudança futura num ADR próprio. |
| R11 | Testes automáticos insuficientes podem deixar diferenças entre frontend `mock`, backend `api` e schema da base de dados passarem até tarde | Baixa | Médio | Manter testes de contrato, fluxo mock, fluxo HTTP da API, gravação com Entity Framework e validação do dataset antes de avançar para modos mais complexos. |
| R12 | Introduzir multiplayer antes de a base do jogo guardar dados de forma estável pode aumentar muito a complexidade técnica | Baixa | Alto | Implementei primeiro uma versão simples com salas por link, dono da sala, nomes únicos e SignalR no backend; já validei uma sala curta em Docker, mas ainda assumo o risco de testes com mais jogadores reais. |
| R13 | Guardar URLs temporários de serviços externos como Mapillary pode fazer com que imagens deixem de carregar mais tarde | Média | Médio | Usar Mapillary primeiro como ferramenta de recolha e revisão; quando for preciso usar imagens Mapillary no jogo, guardar um caminho estável do backend e deixar o backend resolver o thumbnail atual com token local. |
| R14 | Exposição acidental de tokens, origens externas ou dados locais durante a entrega | Baixa | Alto | Manter `.env` fora do Git, deixar `MAPILLARY_ACCESS_TOKEN` apenas no ambiente local, configurar CORS com origens explícitas e rever artefactos locais antes dos commits finais. |

---

## Histórico de atualização

| Data | Risco | Evento | Estado |
|------|-------|--------|--------|
| 25 de março de 2026 | R01–R05 | Identificação inicial dos riscos na proposta e definição das respetivas medidas de mitigação | Em curso |
| 13 de abril de 2026 | R06–R07 | Introdução do modo `mock/api` no frontend e formalização da execução por Docker Compose com perfis | Em curso |
| 23 de abril de 2026 | R08–R11 | Reavaliação dos riscos de alojamento hosted, volume de leituras, eventual migração futura de base de dados e cobertura mínima de testes | Em curso |
| 30 de abril de 2026 | R08–R12 | Decisão de manter PostgreSQL em Docker como base principal para guardar dados e preparar SignalR para multiplayer/realtime | Em curso |
| 18 de maio de 2026 | R13 | Preparação de Mapillary como fonte visual adicional sem guardar imagens temporárias no dataset | Em curso |
| 19 de maio de 2026 | R13 | Adição de endpoint backend para resolver thumbnails Mapillary sem expor token no frontend | Em curso |
| 20 de maio de 2026 | R13 | Lote de 150 fontes Mapillary guardado com caminhos estáveis do backend | Em curso |
| 23 de maio de 2026 | R03, R06, R11 | Revisão do conjunto de locais para 300 entradas, registo de imagens aéreas já revistas e alinhamento do fluxo `mock` com a API | Mitigado para o MVP |
| 23 de maio de 2026 | R12 | Primeira versão multiplayer com salas por link, SignalR e gravação de resultados em PostgreSQL | Mitigado parcialmente |
| 29 de maio de 2026 | R03 | Expansão do conjunto de locais para 1000 entradas reais com imagem, coordenadas, fonte, licença e atribuição | Mitigado para o MVP |
| 2 de junho de 2026 | R14 | Revisão de segredos, CORS e validações server-side antes da validação final em Docker | Mitigado para o MVP |
| 2 de junho de 2026 | R04, R07, R12 | Validação limpa do perfil `full` com sessão solo, sala multiplayer curta, migrations EF e dados confirmados em PostgreSQL | Mitigado para o MVP |
