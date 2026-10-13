# 0002 — Dinheiro como string decimal com decimal.js

**Status:** aceita

## Contexto

ETH tem 18 casas decimais. `number` (IEEE 754) não representa valores como `0.1 + 0.2` com exatidão, e somas de preço × quantidade − desconto + taxa acumulam erro.

## Decisão

- Todo valor monetário trafega (API, eventos, cache, UI) como **string decimal** validada por Zod (`/^\d+(\.\d{1,18})?$/`).
- Toda aritmética passa por `src/shared/money` (`decimal.js`, precisão 64, arredondamento para baixo no wei).
- Quantidades são sempre inteiras e validadas.
- Os valores exibidos no resumo vêm da cotação da API; o cliente usa decimal apenas em regras e comparações.

## Consequências

- Totais exatos e comparáveis entre cliente e servidor simulado.
- `formatEth` centraliza a exibição.
- O `money.test.ts` cobre os casos limítrofes.
