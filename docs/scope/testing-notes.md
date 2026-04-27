# Notas de Testes

Os primeiros testes automatizados foram adicionados para aumentar a confiança ao alterar o backend. Nesta fase, ainda não tentei cobrir todos os fluxos do jogo; optei por começar pelos pontos onde uma alteração futura poderia quebrar a integração com o frontend sem ser imediatamente visível.

## Áreas onde usei apoio

Usei ChatGPT como apoio de aprendizagem para estruturar os testes iniciais em .NET/MSTest, perceber como validar contratos de API e criar verificações simples sobre o schema SQL. O objetivo foi ficar mais confortável para mexer em classes do backend sem depender apenas de testes manuais.

## O que estes testes protegem

- `GameSessionService`: valida que uma sessão criada devolve os campos esperados para o frontend, incluindo imagem da cena e metadata visual.
- `SeedLocationCatalog`: valida indiretamente que o dataset inicial é carregado e convertido para os modelos usados pelo backend.
- `001-init.sql`: valida que o schema inclui os campos necessários para as cenas e para a futura transição para imagens reais.

## Como correr

```bash
dotnet test GeoExplorer.slnx
```

Também é útil correr os testes do frontend quando forem alterados contratos partilhados:

```bash
cd src/frontend
npm test -- --run
```
