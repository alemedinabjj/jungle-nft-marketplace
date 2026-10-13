# 0003 — Boot do MSW sem bloquear o render (request gate)

**Status:** aceita

## Contexto

O padrão comum é `await worker.start()` antes de renderizar o app. Isso coloca o download e o registro do backend simulado no caminho crítico do primeiro paint e do LCP, e foi a principal causa dos scores mobile entre 81 e 85 das soluções de referência.

## Decisão

- `main.tsx` inicia o worker **sem aguardar** e registra a promessa como _gate_ no cliente HTTP (`setRequestGate`). Toda requisição espera o gate; o render, não.
- O `socket.io-client` é importado dinamicamente depois do gate, porque o `engine.io-client` captura `globalThis.WebSocket` no import, e o binding precisa ter feito o patch antes.
- O painel de cenários também é carregado depois do gate.

## Consequências

- O shell, o header e os skeletons aparecem sem esperar o MSW.
- Requisições disparadas antes do worker ficar pronto não falham: ficam enfileiradas.
- Os testes aguardam `window.__kurioMocks` antes de manipular cenários.
