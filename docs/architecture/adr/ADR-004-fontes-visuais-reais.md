# ADR-004 — Fontes visuais reais por local

**Data:** 18 de maio de 2026  
**Estado:** Aceite  
**Decisores:** Marcos Monteiro

---

## Contexto

O GeoExplorer precisa de imagens reais para tornar as rondas úteis e credíveis, mas não deve depender de uma API externa em tempo real para correr a demo. O projeto usa um dataset local com fontes e licenças guardadas por local. Wikimedia Commons e Panoramax podem ser fontes principais de ronda; Panoramax e Mapillary também podem aparecer como fontes adicionais quando há cobertura útil.

O professor também sugeriu uma solução mais aberta e controlada baseada em Mapillary, MapLibre, OpenStreetMap ou num conjunto delimitado de localizações georreferenciadas. A parte do mapa já usa OpenStreetMap/Leaflet no frontend; a parte visual deve continuar a crescer de forma controlada.

---

## Decisão

Decidi manter o dataset local como fonte principal do jogo. Cada local continua a guardar coordenadas, imagem principal, fonte, licença e atribuição. Quando houver fontes adicionais, elas entram em `visualSources`.

Para Mapillary, decidi preparar a recolha através de uma ferramenta local, mas sem transformar Mapillary numa dependência obrigatória da execução do jogo. A API do Mapillary exige token de acesso, por isso a chave fica apenas no ambiente local (`MAPILLARY_ACCESS_TOKEN`) e nunca deve entrar no repositório.

Também adicionei um endpoint no backend para resolver thumbnails Mapillary sem expor o token no frontend: `/api/media/mapillary/{imageId}`. Isto permite guardar no dataset um caminho estável do próprio projeto em vez de guardar diretamente URLs temporários devolvidos pela API.

Depois da primeira recolha, adicionei Mapillary a 150 locais do dataset como fonte visual adicional. Estas entradas usam `/api/media/mapillary/<id>` em `imageUrl` e mantêm a página Mapillary original em `imageSourceUrl` e `streetViewUrl`. O dataset continuou a evoluir depois desta decisão e tem agora 6000 locais reais: 4000 com fonte principal Wikimedia Commons, 2000 com fonte principal Panoramax e 1844 fontes Mapillary adicionais opcionais.

O fluxo passa a ser:

1. Procurar candidatos Mapillary junto dos locais do dataset com `src/database/tools/find-mapillary-sources.mjs`.
2. Rever manualmente a distância, a imagem, a atribuição e os termos de utilização.
3. Só depois copiar entradas aprovadas para `visualSources`, usando `/api/media/mapillary/<id>` como URL quando fizer sentido.
4. Manter Wikimedia/Panoramax como alternativa quando não houver Mapillary adequado.

---

## Alternativas consideradas

| Alternativa | Razão de rejeição |
|------------|------------------|
| Chamar Mapillary diretamente durante o jogo | Criaria dependência de token, rede externa e limites da API durante a demo. |
| Guardar token no frontend | Não é seguro, porque qualquer utilizador conseguiria ver a chave. |
| Guardar `thumb_1024_url` no dataset | Esse URL é temporário e podia deixar de funcionar sem eu alterar o projeto. |
| Adicionar candidatos Mapillary sem revisão manual | Aumentaria o risco de associar uma imagem próxima, mas errada, ao local do desafio. |
| Usar só Wikimedia Commons | É simples, mas perde a possibilidade de ter imagens mais próximas da experiência de rua. |
| Usar só Panoramax | É aberto e adequado, mas a cobertura ainda não é suficiente para todos os locais. |

---

## Consequências

**Positivas:**
- O jogo continua a correr sem depender de Mapillary.
- A chave Mapillary fica fora do repositório.
- O dataset mantém fontes visuais verificáveis e reutilizáveis.
- O backend passa a ter um ponto controlado para resolver thumbnails Mapillary quando o token existir.
- Posso comparar Wikimedia, Panoramax e Mapillary por local sem mudar o contrato da API.

**Negativas / custos:**
- Adicionar Mapillary continua a exigir revisão manual.
- A cobertura depende da disponibilidade de imagens junto de cada local.
- O script ajuda a encontrar candidatos, mas não substitui a validação visual.

## Atualização de 2 de junho de 2026

Documentei o fluxo de fontes visuais em `docs/architecture/visual-sources.md`. A regra principal mantém-se: o jogo corre com o dataset local e as fontes externas servem para recolha, atribuição e enriquecimento controlado dos locais, não como dependência obrigatória durante a demo.

## Atualização de 12 de junho de 2026

Na revisão final, o dataset ficou com 6000 locais reais e passou a incluir Panoramax também como fonte principal de ronda. A distribuição atual é 4000 locais com fonte principal Wikimedia Commons e 2000 com fonte principal Panoramax. Além disso, a auditoria do dataset confirma 2091 fontes visuais Panoramax e 1844 fontes Mapillary guardadas como fontes adicionais quando são úteis. Mantive Mapillary como fonte opcional, resolvida pelo backend quando há token local, para não expor credenciais nem criar dependência obrigatória durante a demonstração.
