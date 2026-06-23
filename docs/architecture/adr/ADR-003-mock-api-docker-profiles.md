# ADR-003 — Abstração `mock/api` e execução com Docker Compose

**Data:** 13 de abril de 2026  
**Estado:** Aceite  
**Decisores:** Marcos Monteiro

---

## Contexto

Era importante começar pelo frontend jogável sem ficar bloqueado por backend e base de dados, mas sem criar um protótipo descartável. Ao mesmo tempo, o projeto tem de ser fácil de correr noutras máquinas e consistente para demonstração e desenvolvimento.

---

## Decisão

Decidi implementar uma camada de dados abstrata no frontend, com dois modos (`mock` e `api`), e definir Docker Compose com perfis separados para `frontend-mock` e `full`.

Depois de ligar a API real, alinhei o comportamento principal do modo `mock` com o backend: ambos evitam selecionar locais demasiado próximos dentro da mesma sessão quando existem alternativas. Também acrescentei testes ao modo `mock` para cobrir uma sessão de várias rondas, resultados finais e validação básica de configuração.

Depois da migração do catálogo real para PostgreSQL, o modo `api` passou a ser o caminho principal da aplicação. O modo `mock` ficou como fallback de desenvolvimento com uma amostra pequena de locais reais, suficiente para testar a interface sem carregar o `locations.json` completo no browser.

Na validação final, usei o perfil `full` para correr frontend em modo `api`, backend e PostgreSQL com um volume limpo. Este perfil passou a ser a forma mais completa de demonstrar o projeto sem configuração escondida.

Esta decisão também surgiu de um problema observado durante a evolução do dataset. Enquanto existiam poucos locais, carregar dados diretamente no frontend era aceitável. Quando o catálogo passou para milhares de entradas, percebi que enviar um `locations.js`/`locations.json` pesado para o browser aumentava o tempo inicial de carregamento e dificultava a manutenção. A solução final foi deixar o backend selecionar os locais necessários a partir da tabela `locations`, mantendo o frontend mais leve.

---

## Alternativas consideradas

| Alternativa | Razão de rejeição |
|------------|------------------|
| Frontend ligado diretamente a dados mock sem abstração | Criaria refatorização desnecessária quando a API real fosse introduzida. |
| Enviar o catálogo completo de locais para o browser | A aplicação ficaria mais pesada, sobretudo com milhares de locais, e o frontend passaria a ter responsabilidade de dados que pertence ao backend. |
| Docker apenas no fim | Aumentaria o risco de divergência entre ambientes e dificultaria demonstrações reproduzíveis. |

---

## Consequências

**Positivas:**
- O frontend pode ser demonstrado e testado antes de a gravação real em base de dados existir.
- A troca de `mock` para `api` fica concentrada na camada de serviços.
- O catálogo real fica em PostgreSQL e o frontend recebe apenas os dados necessários para cada sessão.
- Docker Compose passa a ser uma forma oficial de execução desde cedo.

**Negativas / trade-offs:**
- Surge o risco de divergência entre o comportamento do `mock` e da API real.
- A configuração do projeto fica ligeiramente mais complexa do que num arranque puramente local.

**Mitigação atual:**
- A diferença entre `mock` e `api` é controlada por testes de contrato e por testes de fluxo no frontend.
- Validei o perfil `full` com sessão solo, sala multiplayer curta, migrations EF e dados confirmados em PostgreSQL.
