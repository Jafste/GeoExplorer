# Gestão de Riscos

**Projeto:** GeoExplorer  
**Versão:** 1.2 · 23 de abril de 2026

---

## Tabela de riscos

<!-- Identificar 3 a 5 riscos reais ao projeto. -->
<!-- Probabilidade: Alta / Média / Baixa -->
<!-- Impacto: Alto / Médio / Baixo -->
<!-- Mitigação: o que se faz para reduzir probabilidade ou impacto -->

| ID | Risco | Probabilidade | Impacto | Mitigação |
|----|-------|--------------|---------|-----------|
| R01 | Deriva de âmbito para múltiplos modos de jogo, multijogador ou autenticação antes de o MVP estar estável | Média | Alto | Manter o MVP contratualizado em `docs/scope/requirements.md`; qualquer extensão fica classificada como `Should`, `Could` ou `Won't have`. |
| R02 | Dependência excessiva de APIs externas para imagens, localizações ou mapas durante a demonstração | Média | Alto | Preparar um dataset curado para o MVP e usar serviços externos apenas como apoio à recolha/preparação dos dados. |
| R03 | Dataset europeu insuficiente, inconsistente ou com dúvidas de licenciamento | Média | Alto | Validar cedo um conjunto mínimo de locais com origem documentada, coordenadas corretas e conteúdo visual reutilizável. |
| R04 | Subestimação da complexidade de integração entre frontend com mapa, API .NET e persistência em base de dados | Média | Médio | Implementar uma vertical slice jogável desde cedo e integrar continuamente em vez de deixar a junção para a fase final. |
| R05 | Falta de tempo para testes, diagramas, relatório e preparação da defesa | Alta | Médio | Reservar semanas específicas para estabilização e documentação e evitar concentrar trabalho apenas perto das entregas formais. |
| R06 | Divergência entre o comportamento do frontend em `mock` e a API real | Média | Médio | Definir contratos comuns para `mock` e `api`, reutilizar o mesmo dataset inicial e manter a lógica de ecrã independente da fonte dos dados. |
| R07 | Complexidade adicional de execução com Docker em paralelo com execução local | Média | Médio | Usar Compose com perfis simples, `.env.example` documentado e validação frequente dos comandos de arranque. |
| R08 | O plano gratuito de um fornecedor hosted como Supabase pode não ser suficiente para testes reais em live, por limites de armazenamento, tráfego, leituras, escritas ou pausas de serviço | Média | Médio | Manter PostgreSQL local via Docker como ambiente reprodutível, medir chamadas durante testes, evitar dependência exclusiva de um fornecedor gratuito e preparar alternativa hosted apenas se for necessária. |
| R09 | O padrão real de utilização pode revelar mais leituras à base de dados do que o previsto inicialmente | Média | Médio | Instrumentar a camada de dados para registar chamadas relevantes, cachear dados estáveis como o catálogo de localizações e reavaliar Turso/libSQL apenas com métricas concretas. |
| R10 | Mudança tardia de PostgreSQL para Turso/libSQL pode exigir adaptação do schema, tipos de dados e código de persistência | Baixa | Médio | Isolar a persistência atrás de interfaces de serviço, evitar SQL específico do fornecedor sempre que possível e documentar qualquer mudança futura num ADR próprio. |
| R11 | Testes automáticos insuficientes podem deixar divergências entre frontend `mock`, backend `api` e schema da base de dados passarem até tarde | Média | Médio | Manter testes mínimos de contrato já nesta fase e expandir os testes funcionais apenas depois de estabilizar a integração frontend + API. |
| R12 | Introduzir multiplayer antes do núcleo estar persistido pode aumentar muito a complexidade técnica | Média | Alto | Adiar SignalR até a persistência base estar estável; quando avançar, manter a lógica de salas, timers, palpites e reconnects no backend. |

---

## Histórico de atualização

| Data | Risco | Evento | Estado |
|------|-------|--------|--------|
| 25 de março de 2026 | R01–R05 | Identificação inicial dos riscos na proposta e definição das respetivas medidas de mitigação | Em curso |
| 13 de abril de 2026 | R06–R07 | Introdução do modo `mock/api` no frontend e formalização da execução por Docker Compose com perfis | Em curso |
| 23 de abril de 2026 | R08–R11 | Reavaliação dos riscos de alojamento hosted, volume de leituras, eventual migração futura de base de dados e cobertura mínima de testes | Em curso |
| 30 de abril de 2026 | R08–R12 | Decisão de manter PostgreSQL em Docker como persistência principal e reservar SignalR para multiplayer/realtime futuro | Em curso |
