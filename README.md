# GeoExplorer

> Plataforma web de jogos de geolocalização para treino em OSINT, com desafios baseados em locais de interesse georreferenciados na Europa.


**Estudante:** Marcos Monteiro · 1902045  
**Orientador:** Pedro Pestana  
**UC:** Projecto de Engenharia Informática · Universidade Aberta · 2025/26  
**Repositório:** https://github.com/Jafste/GeoExplorer  

---

## Estado actual

<!-- Actualizar a cada entrega. Escolher um estado e apagar os outros. -->

🟢 **Verde** — Proposta aprovada e estrutura inicial do projeto em preparação.  
🟡 **Amarelo** — [Descrever o que está em risco ou bloqueado, numa linha.]  
🔴 **Vermelho** — [Descrever o problema crítico, numa linha.]  

---

## O que está implementado

<!-- Lista das funcionalidades do MVP que estão funcionais. -->
<!-- Ser específico: não "o login está feito" mas "autenticação por email/password com JWT, sessão persistente em localStorage." -->

- [x] Proposta de projeto — aprovada pelo orientador
- [x] Sinopse, MVP, stack tecnológica e esboço de arquitetura definidos
- [x] Delimitação do MVP — modo individual com locais de interesse georreferenciados na Europa
- [x] Definição inicial da arquitetura e das opções tecnológicas principais

---

## O que está pendente

<!-- O que falta do MVP e porquê. Se algo foi descontinuado, explicar a decisão. -->

- [ ] Implementação do frontend em React — interface inicial, navegação entre ecrãs e interação com mapa
- [ ] Implementação da API em .NET 8 — gestão de sessões, rondas, pontuação e persistência
- [ ] Definição final da fonte dos dados — escolha entre dataset curado, APIs externas ou abordagem híbrida
- [ ] Preparação do dataset inicial — locais de interesse georreferenciados na Europa com metadados e conteúdo visual
- [ ] Implementação do cálculo de pontuação — regra baseada na distância entre palpite e localização correta
- [ ] Registo de resultados — persistência de sessões, rondas e pontuações
- [ ] Avaliação de extensões futuras — modos adicionais e eventual multijogador, caso o tempo de desenvolvimento o permita

---

## Como instalar e correr

<!-- Instruções que funcionam numa máquina limpa. Se não funcionar na demo, não conta como feito. -->

### Pré-requisitos

```
Node.js 20+
.NET 8 SDK
PostgreSQL (ou instância Supabase)
Docker
```

### Instalação

```bash
a definir ainda mas será algo do tipo

# 1. Clonar o repositório
git clone (https://github.com/Jafste/GeoExplorer)
cd GeoExplorer

# 2. Instalar dependências do frontend
cd frontend
npm i

# 3. Restaurar dependências do backend
cd ../api
dotnet restore

# 4. Configurar variáveis de ambiente

cp .env.example .env (ainda não está decidido)
# Editar .env com os valores corretos

# 5. Correr backend
cd ../api
dotnet run

# 6. Correr frontend
cd ../frontend
npm run dev

```

### Acesso

```
a definir
mas algo do tipo:
Frontend: http://localhost:5173
Backend: http://localhost:5000 ou https://localhost:5001
```

---

## Decisões de arquitectura principais

<!-- 2 a 4 decisões relevantes com justificação breve. Para o detalhe completo, ver docs/architecture/adr/. -->

| Decisão | Alternativa considerada | Razão da escolha |
|---------|------------------------|-----------------|
| React | Angular | React foi escolhido por maior familiaridade prévia e por se adequar bem à construção de interfaces interativas e modulares, o que é relevante para uma aplicação com mapas, múltiplos ecrãs e atualização dinâmica do estado do jogo.|
|.NET 8 Web API | - | .NET 8 Web API foi escolhido por maior experiência prévia no ecossistema e por permitir uma separação clara da lógica de negócio, oferecendo uma base robusta e previsível para o backend da aplicação.|
|PostgreSQL / Supabase | MySQL / base de dados local |PostgreSQL foi escolhido por ser um modelo relacional sólido para guardar sessões, rondas, respostas e pontuações. O recurso a Supabase foi considerado interessante por facilitar o alojamento online da base de dados e permitir acompanhamento e teste do projeto sem necessidade de execução exclusivamente local.
|Dataset europeu de locais de interesse georreferenciados| Cobertura global dinâmica desde o início | Foi escolhido um dataset mais controlado e delimitado ao contexto europeu para reduzir risco técnico, aumentar previsibilidade da demonstração e garantir um MVP mais sólido e verificável.|
| Docker | Execução totalmente manual | Docker foi considerado útil para uniformizar o ambiente de desenvolvimento e facilitar a integração e eventual deploy dos componentes principais, especialmente na articulação entre frontend React, backend .NET e serviços auxiliares.|

---

## Referências e IA utilizada

<!-- Bibliotecas, APIs externas, tutoriais seguidos. -->
<!-- Distinguir o que foi escrito de raiz do que foi adaptado ou gerado. -->

### Referências técnicas
<!-- ainda não definido mas a ideia é esta-->
- MapLibre
- OpenStreetMap
- Mapillary
- Google Maps Platform

### Ferramentas de IA utilizadas

<!-- Obrigatório declarar. Não é penalizado. -->

| Ferramenta | Para que foi usada |
|-----------|-------------------|
| ChatGPT | Apoio nos textos da proposta, clarificação da arquitetura e revisão de texto |
| GitHub Copilot | comentários de commit no git |

---

*Última actualização: [25 Março 2026] · [Sem. 3]*
