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

---

## Alternativas consideradas

| Alternativa | Razão de rejeição |
|------------|------------------|
| Frontend ligado diretamente a dados mock sem abstração | Criaria refatorização desnecessária quando a API real fosse introduzida. |
| Docker apenas no fim | Aumentaria o risco de divergência entre ambientes e dificultaria demonstrações reproduzíveis. |

---

## Consequências

**Positivas:**
- O frontend pode ser demonstrado e validado antes da persistência real existir.
- A troca de `mock` para `api` fica concentrada na camada de serviços.
- Docker Compose passa a ser uma forma oficial de execução desde cedo.

**Negativas / trade-offs:**
- Surge o risco de divergência entre o comportamento do `mock` e da API real.
- A configuração do projeto fica ligeiramente mais complexa do que num arranque puramente local.
