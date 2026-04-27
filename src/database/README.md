# Database

Esta pasta contém os artefactos da camada de dados do projeto.

- `seed/locations.json` é o dataset inicial partilhado entre o frontend em `mock` e o backend em `api`.
- `sql/001-init.sql` prepara o esquema base em PostgreSQL para a fase seguinte de persistência real.

Nesta primeira fatia vertical, o backend ainda usa armazenamento em memória para simplificar o arranque do MVP, mas o contrato de dados e o esquema já ficam preparados. A base de dados pode ser iniciada isoladamente com o perfil `database`; o perfil `full` arranca apenas frontend em modo API e backend.

O campo `sceneImage` continua a suportar as cenas SVG mock. A secção opcional `media` prepara a transição para dados reais, guardando, atribuição, licença, URL da imagem e ligação futura a street-level imagery sem obrigar todos os locais a terem uma fotografia real desde já.
