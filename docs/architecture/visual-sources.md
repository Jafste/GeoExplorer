# Fontes Visuais

O GeoExplorer usa um dataset local para reduzir dependência de serviços externos durante o jogo. Cada local tem uma fonte principal e pode ter fontes adicionais em `visualSources`.

```mermaid
flowchart TD
    wikidata["Wikidata / Wikimedia Commons\nprocura e metadados"]
    dataset["locations.json\n1000 locais reais"]
    postgres[("PostgreSQL\nlocations")]
    backend["Backend ASP.NET Core\nseleção de ronda"]
    frontend["Frontend\nmostra imagem e atribuição"]
    panoramax["Panoramax\nfonte adicional"]
    mapillaryTool["Ferramenta local Mapillary\nusa token fora do repositório"]
    mapillaryEndpoint["/api/media/mapillary/{id}\nresolve thumbnail"]
    mapillaryApi["Mapillary API"]

    wikidata -->|"candidatos revistos"| dataset
    panoramax -->|"fontes aprovadas"| dataset
    mapillaryTool -->|"fontes aprovadas"| dataset
    dataset -->|"importação EF"| postgres
    postgres --> backend
    backend -->|"escolhe fonte visual por ronda"| frontend
    frontend -->|"quando é Wikimedia/Panoramax"| frontend
    frontend -->|"quando é Mapillary"| mapillaryEndpoint
    mapillaryEndpoint --> mapillaryApi
```

## Decisões

- Wikimedia Commons é a fonte principal porque fornece imagem, página de origem, licença e atribuição.
- Panoramax é usado quando há cobertura útil e dados suficientes.
- Mapillary é opcional: guardo um caminho estável do backend e não URLs temporários da API.
- A fonte visual escolhida por ronda fica guardada na base de dados, para o resultado continuar consistente.
- O token Mapillary fica apenas no ambiente local através de `MAPILLARY_ACCESS_TOKEN`.
