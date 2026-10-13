# 0006 — Tempo real como delta sobre o REST

**Status:** aceita

## Contexto

Eventos podem chegar duplicados, fora de ordem, depois de uma reconexão ou ser de outro usuário (sessão anterior). Aplicá-los cegamente regride estado e repete efeitos.

## Decisão

- Um reducer puro decide se um evento é aplicado. Ele ignora `eventId` já visto, `version ≤ atual` e `userId` diferente do usuário atual.
- O REST continua sendo a fonte da verdade. Na reconexão, as queries ativas de catálogo, carrinho e pedidos são invalidadas e refeitas.
- Há um socket por sessão de usuário: a troca de usuário fecha o socket e os listeners e recria o ledger.
- O servidor simulado só entrega `order.updated` ao dono do pedido.

## Consequências

- Eventos antigos ou duplicados nunca regridem preço, estoque nem estado do pedido, nem repetem toasts e anúncios (testes unitários + E2E `10-realtime-events`).
- O app continua correto mesmo sem socket: há polling lento para pedidos pendentes.
