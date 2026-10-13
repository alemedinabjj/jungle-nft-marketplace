# Arquitetura

Este documento explica **como** o app funciona e **por quê**. Para rodar, testar e reproduzir cenários, veja o [README](./README.md). As decisões principais também têm registro curto em [`docs/adr/`](./docs/adr).

- [Visão geral e fronteiras](#visão-geral-e-fronteiras)
- [Contratos REST e eventos](#contratos-rest-e-eventos)
- [Erros](#erros)
- [Política de sessão](#política-de-sessão)
- [Estado do carrinho](#estado-do-carrinho)
- [Checkout, idempotência e pedidos](#checkout-idempotência-e-pedidos)
- [Estratégia de cache (TanStack Query)](#estratégia-de-cache-tanstack-query)
- [Reconciliação entre REST e Socket.IO](#reconciliação-entre-rest-e-socketio)
- [Socket.IO via MSW: transporte e limitações do binding](#socketio-via-msw-transporte-e-limitações-do-binding)
- [Backend simulado (MSW)](#backend-simulado-msw)
- [Performance](#performance)
- [Decisões de UX](#decisões-de-ux)
- [Desvios do Figma](#desvios-do-figma)
- [Limitações conhecidas e o que ficou de fora](#limitações-conhecidas-e-o-que-ficou-de-fora)

---

## Visão geral e fronteiras

```
app ──► routes ──► features ──► shared
                      │
                      └─► (API pública de outra feature, só quando inevitável)

mocks ──► shared        (o app nunca importa mocks; só main.tsx os inicia)
```

| Camada             | Responsabilidade                                                                      | Pode importar                           |
| ------------------ | ------------------------------------------------------------------------------------- | --------------------------------------- |
| `src/app`          | Bootstrap: providers, `QueryClient`, router, layout, error boundaries, shell estático | routes, features, shared                |
| `src/routes`       | Rotas **finas**: `validateSearch`, `loader`, `beforeLoad` (guard), `head`, composição | features (via `index.ts`), shared       |
| `src/features/<f>` | Um domínio de negócio                                                                 | shared e a API pública de outra feature |
| `src/shared`       | Contratos, HTTP, dinheiro, UI base (shadcn), config, utilitários                      | só shared                               |
| `src/mocks`        | Backend simulado                                                                      | shared                                  |

Dentro de cada feature:

- `model/` — regras puras (sem React, Axios ou Query), 100% testáveis com Vitest
- `api/` — chamadas Axios validadas por Zod
- `queries/` — query keys (factory), hooks e mutations
- `ui/` — componentes
- `index.ts` — a única porta de entrada

As fronteiras são verificadas pelo ESLint (`eslint-plugin-boundaries` + `no-restricted-imports`) e uma violação quebra o CI:

- deep import entre features;
- app importando `mocks/`;
- `model/` importando React, Axios ou Query.

## Contratos REST e eventos

Fonte única: [`src/shared/contracts`](./src/shared/contracts), com schemas Zod e tipos inferidos. Os **mesmos** schemas validam:

- a entrada nos handlers MSW;
- a resposta no cliente Axios (`schema.parse`);
- os payloads dos eventos Socket.IO.

Valores monetários são strings decimais (`"1.19"`). Quantidades são inteiras. Datas são ISO 8601.

| Recurso         | Método e rota                                                                                                               | Notas                                                                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessão          | `POST /auth/register`                                                                                                       | 201 + sessão · 409 `EMAIL_TAKEN` · 422 por campo                                                                                                                          |
|                 | `POST /auth/login`                                                                                                          | 401 `INVALID_CREDENTIALS` (exibido no campo)                                                                                                                              |
|                 | `GET /auth/session`                                                                                                         | 401 `SESSION_EXPIRED` / `UNAUTHENTICATED`                                                                                                                                 |
|                 | `POST /auth/logout`                                                                                                         | 204; derruba os sockets daquela sessão                                                                                                                                    |
| NFTs            | `GET /nfts?q&categories&networks&minPrice&maxPrice&sort&tab&page&pageSize`                                                  | Busca, filtros combináveis, ordenação e paginação                                                                                                                         |
|                 | `GET /nfts/featured` · `GET /nfts/:id` · `GET /nfts/:id/related`                                                            | 404 `NFT_NOT_FOUND`                                                                                                                                                       |
| Favoritos       | `GET /favorites` · `POST /favorites` · `DELETE /favorites/:nftId`                                                           | Autenticado                                                                                                                                                               |
| Carrinho        | `GET /cart` · `POST /cart/items` · `PATCH /cart/items/:nftId/:editionId` · `DELETE /cart/items/:nftId/:editionId`           | Dono = usuário (Bearer) ou visitante (`X-Guest-Id`) · 409 `INSUFFICIENT_STOCK` · 422 limite por pedido                                                                    |
|                 | `POST /cart/merge`                                                                                                          | Mescla o carrinho do visitante no do usuário após o login                                                                                                                 |
| Cupom / cotação | `POST /cart/coupon` · `DELETE /cart/coupon` · `GET /cart/quote`                                                             | 422 `COUPON_INVALID` / `COUPON_EXPIRED`. A cotação traz subtotal, desconto, taxa de rede, total, disponibilidade por linha e um `fingerprint`                             |
| Pedidos         | `POST /orders` (header `Idempotency-Key`)                                                                                   | Mesma chave → mesmo pedido · mesma chave com outro payload → 409 `IDEMPOTENCY_CONFLICT` · cotação obsoleta → 409 `QUOTE_CHANGED` · sem estoque → 409 `INSUFFICIENT_STOCK` |
|                 | `GET /orders/:id` · `GET /orders?status=pending`                                                                            | Estado e recibo (snapshot)                                                                                                                                                |
| Perfil          | `GET /profile` · `PUT /profile` · `PUT /profile/avatar` · `DELETE /profile/avatar` · `PUT /profile/password`                | 422 por campo; senha atual incorreta → 422 no campo                                                                                                                       |
| Carteiras       | `GET /wallets` · `PUT /wallets/:slot` (`main` / `secondary`) · `POST /wallets/:id/connect` · `POST /wallets/:id/disconnect` | Conexão simulada; recusa → 409 `WALLET_REJECTED`                                                                                                                          |

### Eventos (Socket.IO, canal `event`)

```ts
{ eventId, type, resourceId, version, emittedAt, userId?, data }
```

| Evento          | `data`                                                | Público              |
| --------------- | ----------------------------------------------------- | -------------------- |
| `nft.updated`   | `{ price, available, editions: [{ id, available }] }` | Todos                |
| `order.updated` | `{ status, transactionId, rejectionReason }`          | Só o dono (`userId`) |

Toda mudança no banco simulado passa pela mesma camada, então aparece tanto no REST quanto no evento. Exemplos: preço alterado, estoque esgotado, pedido liquidado.

## Erros

O interceptor do Axios ([`src/shared/http`](./src/shared/http)) normaliza toda falha em `AppError`. A UI decide pelo `kind`, nunca pelo status bruto.

| HTTP                        | `kind`         | Retry automático                     | UI                                                          |
| --------------------------- | -------------- | ------------------------------------ | ----------------------------------------------------------- |
| 400 / 422                   | `validation`   | não                                  | `fieldErrors` aplicados nos campos (`aria-describedby`)     |
| 401                         | `unauthorized` | não                                  | Sessão expirada → login com retorno                         |
| 403                         | `forbidden`    | não                                  | Mensagem de permissão                                       |
| 404                         | `not_found`    | não                                  | 404 contextual                                              |
| 409                         | `conflict`     | não                                  | Conflito explicado (estoque, idempotência, cotação, e-mail) |
| 5xx / rede / timeout (10 s) | `transient`    | sim, só em queries (até 2×, backoff) | Erro com “Tentar novamente”                                 |

Mutations nunca têm retry automático. A única exceção é a criação de pedido, que reenvia **com a mesma `Idempotency-Key`**.

## Política de sessão

- Ao entrar ou se cadastrar, a API devolve `{ token, expiresAt, user }`. O token fica em `localStorage` (`kurio:session`) e o Axios o lê a cada requisição. A senha nunca é guardada no cliente; o banco simulado guarda **hash SHA-256 com salt** (WebCrypto).
- Após refresh, `GET /auth/session` restaura a sessão (query com `staleTime: Infinity`, sem retry).
- **Guard:** a rota pathless `_authed` faz `beforeLoad`. Sem sessão, redireciona para `/login?redirect=<rota>&reason=required`. Depois do login, `safeRedirect` só aceita caminhos internos.
- **Expiração durante a navegação ou o checkout:** qualquer 401 `SESSION_EXPIRED` dispara o `SessionCoordinator`, que:
  1. limpa o cache privado;
  2. anuncia o ocorrido via `aria-live`;
  3. leva ao login com `redirect` e `reason=expired`.

  O rascunho do checkout e a tentativa em andamento ficam em `sessionStorage` por usuário, então o usuário volta exatamente de onde parou.

- **Logout ou troca de usuário:**
  1. `POST /auth/logout`;
  2. `queryClient.cancelQueries()` + `queryClient.clear()`;
  3. limpeza dos rascunhos `kurio:*` da aba;
  4. o `RealtimeProvider` desmonta o socket do usuário anterior (`session:leave`, `removeAllListeners`, `disconnect`) e abre outro.

  Nada do usuário A sobrevive para o B, nem no cache, nem no storage, nem no socket. Isso é coberto pelo E2E `03-auth`.

## Estado do carrinho

- **O servidor é a fonte da verdade.** O cliente só guarda o identificador do dono:
  - usuário: `user:<id>`, via Bearer;
  - visitante: `guest:<uuid>`, via `X-Guest-Id`, persistido em `localStorage`.

  Por isso o carrinho sobrevive a refresh, troca de aba e login.

- **Merge visitante → usuário:** acontece no login (`POST /cart/merge`), respeitando o estoque e o `maxPerOrder` de cada edição (regras puras em `features/cart/model/cart.ts`). Um GET pré-merge ainda em voo é cancelado, para não sobrescrever o resultado.
- **Limites:** disponibilidade por NFT e por edição, e quantidade máxima por pedido. Validados no cliente (UX) e no servidor (regra).
- **Resumo:** subtotal, desconto, taxa de rede e total vêm **sempre** de `GET /cart/quote`. O cliente não recalcula valores para exibir; usa `decimal.js` apenas em regras e comparações.
- **Tempo real:** `nft.updated` atualiza o preço e a disponibilidade das linhas no cache, avisa via toast + `aria-live` e invalida a cotação.
- **Após a compra:** só os itens e as quantidades comprados saem do carrinho. Em falha ou recusa, o carrinho fica intacto.

## Checkout, idempotência e pedidos

1. **Formulário:** react-hook-form + Zod, com erros por campo. Carteira e rede usam as carteiras cadastradas, com conexão simulada, recusa e desconexão.
2. **Revisão:** resumo final com a cotação vigente.
3. **Revalidação antes de confirmar:** a cotação é rebuscada e comparada à revisada (`features/quote/model/quote-diff.ts`: preço, disponibilidade, cupom, taxa e total). Se algo mudou, a confirmação é bloqueada, as diferenças são destacadas e o usuário precisa confirmar de novo. O servidor também recusa uma cotação obsoleta (409 `QUOTE_CHANGED`, pelo `fingerprint`).
4. **Idempotência** (`features/checkout/model/idempotency.ts`):
   - uma `Idempotency-Key` por **tentativa**: mesmo payload → mesma chave; payload novo → chave nova;
   - a tentativa em andamento (chave + payload) é persistida em `sessionStorage` antes do envio;
   - cliques repetidos são ignorados enquanto há envio em voo;
   - em erro transitório ou timeout, há um reenvio automático com a **mesma** chave; depois disso, “Tentar novamente” também reusa a chave;
   - depois de um refresh no meio da compra, o app reenvia a tentativa salva e recebe **o mesmo pedido**;
   - o servidor responde com o pedido existente para a mesma chave e com 409 para a mesma chave com outro conteúdo.
5. **Pedido:** `pending → confirmed | rejected`, e os dois últimos são terminais (`mergeOrder` nunca regride um estado terminal nem aceita versão menor). A confirmação chega por `order.updated`, com polling lento de segurança enquanto `pending`. A tela de sucesso só aparece com `confirmed` vindo da simulação.
6. **Recibo:** é um **snapshot** gravado no pedido (linhas, preços, cupom, taxa, total). Mudanças posteriores no catálogo não o alteram.

## Estratégia de cache (TanStack Query)

Query keys em factory por feature (`catalogKeys.list(query)`, `cartKeys.detail(owner)`, `orderKeys.detail(userId, id)`…). **Toda key privada inclui o dono.** A key do catálogo é exatamente o objeto de parâmetros enviado à API.

| Dado               | Key                                         | `staleTime` | `gcTime`       | Sincronização                                                                            |
| ------------------ | ------------------------------------------- | ----------- | -------------- | ---------------------------------------------------------------------------------------- |
| Sessão             | `['auth','session']`                        | `Infinity`  | `Infinity`     | Login/logout/expiração escrevem direto no cache                                          |
| Catálogo (lista)   | `['catalog','list',query]`                  | 30 s        | 5 min (padrão) | `keepPreviousData`; `AbortSignal` cancela buscas superadas; `nft.updated` atualiza itens |
| Destaques          | `['catalog','featured']`                    | 5 min       | 5 min          | `nft.updated`                                                                            |
| Detalhe            | `['catalog','detail',id]`                   | 30 s        | 5 min          | `nft.updated` (preço, estoque, edições)                                                  |
| Relacionados       | `['catalog','related',id]`                  | 60 s        | 5 min          | —                                                                                        |
| Carrinho           | `['cart',owner,'detail']`                   | 10 s        | 5 min          | Mutations escrevem a resposta; `nft.updated` atualiza linhas                             |
| Cotação            | `['cart',owner,'quote']`                    | 0           | 5 min          | Invalidada a cada mutation do carrinho, cupom e `nft.updated`                            |
| Favoritos          | `['favorites',userId]`                      | 60 s        | 5 min          | **Otimista com rollback**                                                                |
| Pedido             | `['orders',userId,'detail',id]`             | 5 s         | 5 min          | `order.updated`; polling de 4 s enquanto `pending`                                       |
| Perfil / carteiras | `['profile',userId]` / `['wallets',userId]` | 60 s / 30 s | 5 min          | Mutations escrevem a resposta                                                            |

Padrões globais ([`src/app/query-client.ts`](./src/app/query-client.ts)):

- retry só para erro `transient` (até 2×, backoff exponencial até 4 s);
- sem retry em 4xx;
- mutations sem retry;
- `refetchOnWindowFocus` desligado: a atualização vem dos eventos em tempo real e das invalidações.

Os loaders das rotas disparam as queries sem bloquear a navegação (os skeletons aparecem enquanto isso). O router não mantém cache próprio (`defaultPreloadStaleTime: 0`): quem manda é o Query.

## Reconciliação entre REST e Socket.IO

O REST é a fonte da verdade. Os eventos são deltas aplicados com segurança:

1. **Validação:** o payload passa pelo schema Zod; se for inválido, é descartado.
2. **Reducer puro** ([`features/realtime/model/event-reducer.ts`](./src/features/realtime/model/event-reducer.ts), testado):
   - ignora `eventId` já visto (duplicata);
   - ignora `version ≤ versão atual` do recurso (evento antigo), sem regredir estado nem reaplicar efeitos (toasts, anúncios);
   - ignora eventos com `userId` diferente do usuário atual.
3. **Aplicação no cache:** `nft.updated` atualiza lista, destaques, detalhe e linhas do carrinho, e invalida a cotação. `order.updated` passa por `mergeOrder`.
4. **Reconexão:** no `connect` seguinte a uma queda, invalida e refaz via REST as queries **ativas** de catálogo, carrinho e pedidos, porque eventos podem ter sido perdidos enquanto o socket estava fora.
5. **Isolamento por usuário:** há um socket por sessão, e o cliente se autentica com `session:join { token }`. Como a dependência do efeito é o `userId`, trocar de usuário fecha o socket anterior (com seus listeners) e cria outro com um _ledger_ de eventos novo. O servidor simulado só entrega `order.updated` aos sockets do dono.
6. **Pedido pendente e conexão caída:** o pedido continua no servidor. Após reconectar ou dar refresh, o app busca `GET /orders/:id` e, se a tentativa ainda estiver em `sessionStorage`, reenvia com a **mesma** chave. Assim recupera o mesmo pedido e nunca cria uma segunda compra.

## Socket.IO via MSW: transporte e limitações do binding

| Pegadinha do `@mswjs/socket.io-binding`                              | Como foi tratada                                                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Só funciona com transporte WebSocket                                 | `io(url, { transports: ['websocket'] })`                                                                         |
| O MSW remove o prefixo `/socket.io/` antes do match                  | O handler escuta a origem: `ws.link('wss://realtime.mock/*')`                                                    |
| O `engine.io-client` captura `globalThis.WebSocket` ao ser importado | `socket.io-client` é carregado com `import()` **depois** que o worker do MSW está pronto (`whenRequestsReady()`) |
| O binding não envia ping do Engine.IO                                | O servidor simulado manda heartbeat (`"2"`) a cada 20 s, para o cliente não derrubar a conexão                   |

Os listeners são liberados no cleanup do efeito (`removeAllListeners` do socket e do manager).

## Backend simulado (MSW)

- **Um único banco** ([`src/mocks/db`](./src/mocks/db)) para catálogo, usuários, sessões, favoritos, carrinhos, cupons, carteiras, pedidos e log de eventos. Fica persistido em `localStorage` com versão de schema, e o reset restaura integralmente um estado conhecido.
- **Fixtures determinísticas:**
  - 48 NFTs; os 9 primeiros espelham a grade do Figma, e há variedade de categoria, rede, preço, desconto e edições esgotadas;
  - 2 usuários;
  - cupons válido e expirado;
  - datas fixas, para o recibo e a ordenação serem estáveis.
- **Handlers por feature** em `src/mocks/features/<f>/handlers.ts`, validando a entrada com os mesmos contratos Zod.
- **Cenários** ([`src/mocks/scenarios/registry.ts`](./src/mocks/scenarios/registry.ts)): latência fixa ou em sequência, falhas por grupo de endpoint, respostas fora de ordem, TTL de sessão, perturbações do checkout (preço, estoque, timeout, recusa) e recusa de carteira. Selecionáveis por `?scenario=`, pelo painel ou por `window.__kurioMocks`.
- **Ativação:** `VITE_ENABLE_MOCKS=true` (dev, testes e deploy de demonstração). A mesma camada atende os três.

## Performance

Meta: Lighthouse ≥ 90 / 95 / 95 / 90, mediana de 3 execuções. Números atuais e relatórios no [README](./README.md#lighthouse).

| Técnica                                                                                                                                                               | Efeito                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Shell estático** inlined no `index.html`: header, hero e skeletons capturados do próprio app ([ADR 0005](./docs/adr/0005-static-app-shell.md))                      | FCP e LCP do início não dependem de JS, API ou MSW. Um teste E2E (`13-app-shell`) garante que o shell é idêntico ao primeiro render do React, sem flash nem layout shift |
| **Boot após o primeiro paint** (o entry é importado depois que o shell e a arte do hero pintam; sem `modulepreload` no HTML)                                          | O JS não compete com o primeiro paint                                                                                                                                    |
| Avaliação do bundle em tarefas separadas (env → contratos → React → app, com _yield_), `router.load()` antes do primeiro render e render inicial em `startTransition` | Sem tarefa longa única no boot e sem re-render síncrono do router no meio do render (TBT)                                                                                |
| Rodapé e seções editoriais renderizados após o primeiro commit (`Deferred`, em _idle_)                                                                                | Primeiro commit menor                                                                                                                                                    |
| `tldts` (Public Suffix List, via MSW → `tough-cookie`) trocado por versão mínima (`src/mocks/vendor/tldts-lite.ts`), pois os mocks não usam cookies                   | Chunk dos mocks de ~148 KB para ~36 KB gzip                                                                                                                              |
| MSW em paralelo com _request gate_ ([ADR 0003](./docs/adr/0003-non-blocking-mock-boot.md))                                                                            | O shell renderiza sem esperar o worker                                                                                                                                   |
| `socket.io-client` e painel de cenários via `import()` após o worker                                                                                                  | Fora do bundle inicial                                                                                                                                                   |
| Code-split por rota (`autoCodeSplitting`)                                                                                                                             | Cada tela carrega só o seu código                                                                                                                                        |
| Imagens AVIF/WebP responsivas, `width`/`height`, `aspect-ratio`, `fetchpriority` só no LCP, `lazy` abaixo da dobra; preload da arte do hero                           | LCP rápido e CLS ≈ 0                                                                                                                                                     |
| Roboto Mono self-hosted, WOFF2 com subset latin, `font-display: swap` e preload                                                                                       | Sem FOIT nem requisições externas                                                                                                                                        |
| Formatadores `Intl` criados sob demanda                                                                                                                               | Nada caro no import                                                                                                                                                      |

**Detalhe mobile em 87, abaixo de 90.** O LCP do detalhe é a arte do NFT, e a URL dela vem da API. Aqui a API é o MSW executando **no navegador**, então o LCP soma:

1. o download e a avaliação do backend simulado (≈60 KB gzip, entre MSW, fixtures, handlers e binding);
2. o registro do service worker;
3. a resposta;
4. o render.

Tudo isso sob 4G lento e CPU 4×. Num ambiente real (API no servidor e imagens em CDN), essas etapas não existem no cliente.

A alternativa avaliada foi derivar a URL da imagem do id do token (padrão comum de CDN), o que tiraria o LCP do caminho da API. Ela foi deixada de fora para não distorcer o contrato do desafio só por causa da auditoria. Nada foi simplificado para a medição: as imagens, os mocks e o tempo real continuam ligados.

## Decisões de UX

- **Estado na URL:** busca, filtros, ordenação, aba e página ficam na URL, com serialização legível (`?categories=music,digital-art`, não JSON). Mudar um filtro volta para a página 1.
- **Nada finge sucesso:** ações fora do escopo (login social, recuperação de senha, links editoriais, Etherscan) ficam desabilitadas e dizem isso, inclusive para leitores de tela.
- **Feedback acessível:** toda mutation (carrinho, cupom, favoritos, perfil, carteiras) e todo evento em tempo real é anunciado em `aria-live`, e erros de formulário ficam associados ao campo.
- **Skeletons com as mesmas dimensões do conteúdo** (catálogo, detalhe, resumo do carrinho), com shimmer desligado em `prefers-reduced-motion`.
- **Erro sempre com saída:** “Tentar novamente” em falhas transitórias, 404 com caminho de volta, recusa de pagamento com retorno ao carrinho preservado.
- **Indicador de tempo real** no header (conectado / reconectando).
- **Revisão obrigatória** antes de pagar, com destaque do que mudou quando a cotação fica obsoleta.

## Desvios do Figma

| Onde                                                                                             | Desvio                                                                                                            | Motivo                                                           |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Telas mobile e tablet                                                                            | O Figma só tem desktop (1440). As versões 390/768 foram desenhadas com os mesmos tokens, tipografia e componentes | Responsividade exigida pelo desafio                              |
| Hero no mobile                                                                                   | Arte em faixa larga (16:10) acima do texto, em vez de miniatura lateral                                           | Legibilidade em 390 px e LCP estático                            |
| Navegação mobile                                                                                 | Barra inferior (Início, Favoritos, Carrinho, Conta) e busca no topo                                               | Padrão de uso com o polegar; o header desktop não cabe em 390 px |
| Login social / WalletConnect                                                                     | Visíveis, mas desabilitados com aviso                                                                             | Fora do escopo; evitar sucesso falso                             |
| Ícones das redes sociais no rodapé                                                               | Monogramas (`f`, `ig`, `x`, `in`, `yt`)                                                                           | Sem marcas de terceiros                                          |
| Estados não desenhados (vazio, erro, carregando, 404, recusa, pedido pendente, cotação obsoleta) | Criados no mesmo estilo visual                                                                                    | Exigidos pelos fluxos                                            |
| Recibo                                                                                           | Página (`/orders/:id`) em vez de modal                                                                            | Sobreviver a refresh e reconexão                                 |

## Limitações conhecidas e o que ficou de fora

- O backend é simulado no navegador: cada navegador tem seu próprio “servidor”, e os dados persistem só localmente.
- Recuperação de senha, login social, páginas editoriais, atividade e estúdio do criador estão fora do escopo (aparecem desabilitados).
- O upload de avatar é simulado: a imagem é reduzida e guardada como data URL no banco local.
- O detalhe mobile fica em 87 no Lighthouse, abaixo de 90 (ver [Performance](#performance)).
- As baselines visuais são a referência do runner Linux do CI. Em outros sistemas, diferenças de rasterização de fonte podem exigir `pnpm test:e2e:update` local.
