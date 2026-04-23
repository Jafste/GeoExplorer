# GeoExplorer

> Plataforma web de jogos de geolocalização para treino em OSINT, com desafios baseados em locais de interesse georreferenciados na Europa.

**Estudante:** Marcos Monteiro · 1902045  
**Orientador:** Pedro Pestana  
**UC:** Projeto de Engenharia Informática · Universidade Aberta · 2025/26  
**Repositório:** https://github.com/Jafste/GeoExplorer

---

## Estado atual

🟢 **Verde** — Proposta aprovada, artefactos da Entrega 1 estruturados, frontend `mock` jogável implementado e backend inicial em ASP.NET Core preparado para o fluxo principal. A persistência real ainda está em integração; PostgreSQL mantém-se como base de dados alvo, com Supabase como opção hosted natural e Turso/libSQL em avaliação futura após métricas de utilização.

---

## O que está implementado

- [x] Proposta de projeto aprovada e documentação de âmbito preenchida
- [x] Wireframes e artefactos de arquitetura normalizados para o template
- [x] Frontend inicial com React + TypeScript + Vite
- [x] Sistema visual base com Tailwind e paleta inicial do projeto
- [x] Componentes UI e auxiliares de layout reutilizáveis para a interface
- [x] Fluxo jogável local com ecrãs de início, configuração, ronda, resultado da ronda, relatório final e tutorial
- [x] Camada de dados abstrata com suporte a `mock` e `api`
- [x] Dataset europeu inicial com cenas mock, caminhos `sceneImage` e contratos de jogo
- [x] Assets visuais `mock` para cenas de jogo
- [x] Interface em português
- [x] Execução local do frontend preparada
- [x] Backend inicial ASP.NET Core para sessões, ronda atual, submissão de palpite, timeout e resultados
- [x] Docker Compose com perfis de execução
- [x] Testes mínimos de contrato do backend

---

## O que está pendente

- [ ] Integrar persistência real em PostgreSQL no backend
- [ ] Avaliar Supabase como hosted quando a persistência estiver estável
- [ ] Medir chamadas à base de dados e reavaliar Turso/libSQL apenas se o padrão real justificar
- [ ] Ligar o frontend à API real e estabilizar o fluxo ponta a ponta
- [ ] Expandir testes automáticos aos fluxos principais do frontend e backend
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

```bash
# Backend
dotnet run --project src/backend/backend.csproj
```

```bash
# Docker
docker compose --profile frontend-mock up
docker compose --profile full up
docker compose --profile database up
```

### Acesso

```text
Frontend local: http://localhost:5173
Backend local: http://localhost:8080/api/health
```

O frontend pode correr em modo `mock` para demonstração rápida ou em modo `api` para validar a integração com o backend. A base de dados PostgreSQL ainda está preparada como schema inicial e será ligada à API numa etapa seguinte.

---

## Decisões de arquitetura principais

| Decisão | Alternativa considerada | Razão da escolha |
|---------|------------------------|-----------------|
| React + TypeScript | Angular | Permite construir rapidamente a interface do jogo e manter uma base de frontend tipada e extensível. |
| ASP.NET Core .NET 8 Minimal API | Outra stack backend | Mantém coerência com a proposta aprovada e fica preparado para a fase seguinte de integração. |
| PostgreSQL local, Supabase como hosted preferencial | Turso/libSQL | Mantém coerência com a proposta aprovada e com o modelo relacional; Turso fica em avaliação futura após métricas de leitura/escrita. |
| Dataset europeu local partilhado | Dependência imediata de APIs externas | Reduz risco técnico e permite preparar um modo `mock` controlado antes da integração final. |
| Docker Compose com perfis | Execução apenas manual | Uniformiza o arranque do frontend, backend e base de dados sem obrigar todos os serviços a correrem sempre em simultâneo. |

Para detalhe adicional, ver [`docs/architecture/adr`]

---

## Referências e IA utilizada

### Referências técnicas

- React
- Vite
- ASP.NET Core .NET 8
- PostgreSQL
- Supabase
- Docker Compose

### Ferramentas de IA utilizadas

| Ferramenta | Para que foi usada |
|-----------|-------------------|
| ChatGPT | Apoio na proposta, clarificação da arquitetura, wireframes, planeamento do MVP e estruturação inicial do projeto |
| GitHub Copilot | Apoio pontual no contexto de desenvolvimento e sugestões de código |
| Gemini | Apoio para imagens e logótipos |

---

*Última atualização: [23 Abril 2026] · [Sem. 6]*
