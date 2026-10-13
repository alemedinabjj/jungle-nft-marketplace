# 0004 — Checkout idempotente com tentativa persistida

**Status:** aceita

## Contexto

Cliques repetidos, timeout depois de o servidor criar o pedido, queda de conexão e refresh no meio da compra não podem gerar duas compras.

## Decisão

- Uma `Idempotency-Key` aleatória por **tentativa**, associada ao hash do payload: reenviar o mesmo payload reusa a chave, e um payload diferente gera uma chave nova.
- Antes do envio, a tentativa (chave + payload) é gravada em `sessionStorage` por usuário. Depois de um refresh, o app reenvia a tentativa salva com a mesma chave.
- Em erro transitório, há um reenvio automático com a mesma chave; depois, o usuário pode tentar de novo, ainda com a mesma chave.
- No servidor, a mesma chave devolve o mesmo pedido, e a mesma chave com outro conteúdo devolve 409.
- Erros de negócio (409 de cotação ou estoque, 422) encerram a tentativa e voltam à revisão.

## Consequências

- Exatamente um pedido por intenção de compra, coberto pelos E2E `07-payment-failures` e `10-realtime-events`.
- A tentativa expira com a aba (`sessionStorage`) e é apagada no logout explícito.
