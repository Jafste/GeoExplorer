# ADR-002 — Backend com ASP.NET Core e PostgreSQL

**Data:** 13 de abril de 2026  
**Estado:** Aceite  
**Decisores:** Marcos Monteiro

---

## Contexto

O projeto precisa de uma API para gerir sessões, rondas, palpites, timeout e resultados finais. Também precisa de uma base de dados relacional para persistir sessões e rondas numa fase seguinte, mesmo que a primeira implementação funcional use armazenamento em memória para acelerar o arranque do MVP.

---

## Decisão

Decidi usar ASP.NET Core .NET 8 com Minimal API no backend e PostgreSQL como base de dados alvo.

---

## Alternativas consideradas

| Alternativa | Razão de rejeição |
|------------|------------------|
| FastAPI | Menor alinhamento com a experiência prévia escolhida para o projeto e menor coerência com a proposta aprovada. |
| Base de dados apenas local em ficheiros | Não prepara de forma adequada a persistência relacional necessária para sessões, rondas e pontuações. |

---

## Consequências

**Positivas:**
- O backend fica organizado em torno de contratos claros e facilmente evolutivos.
- PostgreSQL encaixa naturalmente no modelo relacional do projeto.
- Minimal API reduz overhead na primeira fatia vertical.

**Negativas / trade-offs:**
- Exige gerir dois runtimes no desenvolvimento: Node.js e .NET.
- A persistência real em PostgreSQL fica para uma etapa seguinte, criando uma fase transitória com armazenamento em memória.
