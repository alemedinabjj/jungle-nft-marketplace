# 0001 — Arquitetura por feature com fronteiras verificadas por lint

**Status:** aceita

## Contexto

Um marketplace com 9 telas, tempo real e um backend simulado cresce rápido. Uma organização por tipo de arquivo (`components/`, `hooks/`, `services/`) espalha cada regra de negócio por várias pastas e deixa os acoplamentos implícitos.

## Decisão

- Código organizado por **feature** (`auth`, `catalog`, `cart`, `checkout`…). Cada feature tem as camadas `model/` (puro), `api/`, `queries/` e `ui/`, e uma API pública única em `index.ts`.
- Dependências em sentido único: `app → routes → features → shared`. As rotas são finas (search params, loader, guard, composição).
- Fronteiras verificadas no lint (`eslint-plugin-boundaries` + `no-restricted-imports`):
  - sem deep import entre features;
  - o app não importa `mocks/`;
  - `model/` não importa React, Axios nem Query.

## Consequências

- As regras de negócio (dinheiro, carrinho, cotação, idempotência, reducer de eventos) ficam testáveis isoladamente com Vitest.
- Uma violação de fronteira quebra o CI em vez de virar dívida silenciosa.
- Há algum código de “cola” nas rotas quando duas features precisam conversar. É o preço de manter as features independentes.
