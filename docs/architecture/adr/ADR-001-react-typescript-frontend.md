# ADR-001 — Frontend com React e TypeScript

**Data:** 13 de abril de 2026  
**Estado:** Aceite  
**Decisores:** Marcos Monteiro

---

## Contexto

O projeto exige uma interface web interativa com vários ecrãs, gestão de estado de sessão, temporizador opcional por ronda e uma área de mapa com forte componente visual. Era necessário escolher uma stack que permitisse iterar rapidamente no MVP e evoluir depois para integração com API real sem reestruturar o frontend.

---

## Decisão

Decidi usar React com TypeScript e Vite para o frontend do GeoExplorer.

---

## Alternativas consideradas

| Alternativa | Razão de rejeição |
|------------|------------------|
| Angular | Aumenta a complexidade inicial para um MVP de licenciatura e não traz vantagem clara para esta primeira fatia vertical. |
| HTML/CSS/JS sem framework | Reduziria a estrutura e a reutilização necessária para gerir o fluxo completo do jogo e a futura troca de `mock` para `api`. |

---

## Consequências

**Positivas:**
- Permite construir rapidamente o fluxo completo do jogo com componentes reutilizáveis.
- TypeScript ajuda a estabilizar os contratos usados tanto em `mock` como em `api`.
- Vite simplifica desenvolvimento local e integração com Docker.

**Negativas / trade-offs:**
- Introduz dependência do ecossistema Node.js.
- Obriga a manter disciplina na modelação de estado para evitar acoplamento excessivo entre ecrãs e serviços.
