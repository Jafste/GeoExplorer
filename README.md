# GeoExplorer

> Plataforma web de jogos de geolocalização para treino em OSINT, com desafios baseados em locais de interesse georreferenciados na Europa.

**Estudante:** Marcos Monteiro · 1902045  
**Orientador:** Pedro Pestana  
**UC:** Projecto de Engenharia Informática · Universidade Aberta · 2025/26  
**Repositório:** https://github.com/Jafste/GeoExplorer

---

## Estado actual

🟢 **Verde** — Proposta aprovada, artefactos da Entrega 1 estruturados e base técnica do frontend preparada com React, TypeScript, Vite, Tailwind e componentes reutilizáveis. As páginas do jogo, os dados `mock` e o backend ficam para a fase seguinte.

---

## O que está implementado

- [x] Proposta de projeto aprovada e documentação de âmbito preenchida
- [x] Wireframes e artefactos de arquitetura normalizados para o template
- [x] Frontend inicial com React + TypeScript + Vite
- [x] Sistema visual base com Tailwind e paleta inicial do projeto
- [x] Componentes UI e helpers de layout reutilizáveis para a interface
- [x] Execução local do frontend preparada

---

## O que está pendente

- [ ] Implementar as páginas principais do MVP no frontend
- [ ] Introduzir a camada de dados abstrata com suporte a `mock` e `api`
- [ ] Criar o dataset inicial de desenvolvimento e os contratos de jogo
- [ ] Preparar a execução do frontend com Docker como forma complementar de arranque
- [ ] Introduzir o backend ASP.NET Core para sessões, ronda atual, submissão de palpite, timeout e resultados
- [ ] Integrar persistência real em PostgreSQL no backend
- [ ] Ligar o frontend à API real e estabilizar o fluxo ponta a ponta
- [ ] Adicionar testes automáticos aos fluxos principais do frontend e backend
- [ ] Avaliar extensões futuras, incluindo modo multijogador assíncrono, apenas após estabilização do núcleo

---

## Como instalar e correr

### Pré-requisitos

```text
Node.js 20+
Docker
```

### Execução local

```bash
# Frontend
cd src/frontend
npm install
npm run dev
```

### Acesso

```text
Frontend local: http://localhost:5173
```

Nesta fase, o frontend corresponde apenas à base técnica e visual. O fluxo jogável, os dados `mock`, a execução via Docker e a integração com API serão introduzidos nos próximos incrementos.

---

## Decisões de arquitectura principais

| Decisão | Alternativa considerada | Razão da escolha |
|---------|------------------------|-----------------|
| React + TypeScript | Angular | Permite construir rapidamente a interface do jogo e manter uma base de frontend tipada e extensível. |
| ASP.NET Core .NET 8 Minimal API | Outra stack backend | Mantém coerência com a proposta aprovada e fica preparado para a fase seguinte de integração. |
| PostgreSQL | Ficheiros locais ou MySQL | Ajusta-se bem à persistência relacional de sessões, rondas, palpites e pontuação. |
| Dataset europeu local partilhado | Dependência imediata de APIs externas | Reduz risco técnico e permite preparar um modo `mock` controlado antes da integração final. |
| Docker Compose com perfis | Execução apenas manual | Fica previsto para uniformizar o arranque do projeto quando frontend, backend e base de dados estiverem ligados. |

Para detalhe adicional, ver [`docs/architecture/adr`]

---

## Referências e IA utilizada

### Referências técnicas

- React
- Vite
- ASP.NET Core .NET 8
- PostgreSQL
- Docker Compose

### Ferramentas de IA utilizadas

| Ferramenta | Para que foi usada |
|-----------|-------------------|
| ChatGPT / Codex | Apoio na proposta, clarificação da arquitetura, wireframes, planeamento do MVP e scaffold inicial do projeto |
| GitHub Copilot | Apoio pontual no contexto de desenvolvimento e sugestões de código |

---

*Última actualização: [15 Abril 2026] · [Sem. 5]*
