# Kurio — Marketplace de NFTs

[![CI](https://github.com/alemedinabjj/jungle-nft-marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/alemedinabjj/jungle-nft-marketplace/actions/workflows/ci.yml)

Solução do desafio frontend da Jungle Gaming: um marketplace de NFTs em React + TypeScript, construído a partir do Figma, com backend 100% simulado na camada de rede (MSW + Socket.IO) e testado de ponta a ponta com Playwright.

**Demo:** https://jungle-nft-marketplace-three.vercel.app · **Repositório:** https://github.com/alemedinabjj/jungle-nft-marketplace

| Usuário     | E-mail            | Senha       |
| ----------- | ----------------- | ----------- |
| Ana Ribeiro | `ana@kurio.dev`   | `Kurio2026` |
| Bruno Costa | `bruno@kurio.dev` | `Kurio2026` |

Cupons: `KURIO10` (válido, 10%) · `LAUNCH24` (expirado) · qualquer outro código é inválido.

---

## Sumário

1. [O que foi entregue](#o-que-foi-entregue)
2. [Stack](#stack)
3. [Como rodar](#como-rodar)
4. [Comandos](#comandos)
5. [Cenários simulados (seleção e reset)](#cenários-simulados-seleção-e-reset)
6. [Como reproduzir cada fluxo de falha](#como-reproduzir-cada-fluxo-de-falha)
7. [Testes](#testes)
8. [Lighthouse](#lighthouse)
9. [Arquitetura em 1 minuto](#arquitetura-em-1-minuto)
10. [Acessibilidade](#acessibilidade)
11. [Deploy](#deploy)
12. [Limitações conhecidas](#limitações-conhecidas)

Documentação complementar: [`ARCHITECTURE.md`](./ARCHITECTURE.md) (contratos, sessão, carrinho, cache, tempo real, decisões de UX, desvios do Figma) e [`docs/adr/`](./docs/adr) (registros de decisão).

---

## O que foi entregue

| Tela                 | Rota                      | Destaques                                                                                                                                                                                                                                |
| -------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Início / catálogo    | `/`                       | Busca, filtros combináveis (categoria, rede, faixa de preço), ordenação, abas e paginação **na URL** (sobrevivem a refresh e voltar/avançar); qualquer filtro volta para a página 1; respostas fora de ordem descartadas (`AbortSignal`) |
| Detalhe do NFT       | `/nft/$nftId`             | Galeria, edições (1/1, 1/10, 1/50, aberta), limite de quantidade por edição, edição esgotada, NFT inexistente (404), preço e estoque ao vivo                                                                                             |
| Carrinho             | `/cart`                   | Quantidades com limites, remoção, cupom (aplicar/remover, inválido/expirado), resumo vindo da **cotação da API**, persistência após refresh e merge visitante → usuário no login                                                         |
| Pagamento            | `/checkout` (autenticado) | Formulário validado, carteira e rede, conexão simulada (recusa/desconexão), **etapa de revisão**, revalidação de preço/estoque/cupom/taxa antes de confirmar, **idempotência**                                                           |
| Confirmação / recibo | `/orders/$orderId`        | Estados `pending → confirmed / rejected`, recuperação após refresh/reconexão, recibo como **snapshot** do pedido                                                                                                                         |
| Login / cadastro     | `/login`, `/register`     | Erros da API nos campos, redirect de retorno, expiração de sessão com contexto preservado                                                                                                                                                |
| Perfil               | `/profile`                | Dados, avatar (upload/remoção), troca de senha com validação                                                                                                                                                                             |
| Carteiras            | `/wallets`                | Principal/secundária, rede, conexão simulada, recusa e desconexão                                                                                                                                                                        |
| Favoritos            | `/favorites`              | Atualização **otimista com rollback**                                                                                                                                                                                                    |
| 404                  | qualquer rota inexistente | Página própria; acesso direto a qualquer rota funciona                                                                                                                                                                                   |

Tempo real (Socket.IO via `@mswjs/socket.io-binding`): `nft.updated` atualiza preço e estoque no catálogo, no detalhe e no carrinho; `order.updated` confirma ou recusa o pedido. Duplicatas e versões antigas são ignoradas, a reconexão reconcilia via REST e eventos de outro usuário nunca vazam.

## Stack

React 19 · TypeScript (strict) · Vite · TanStack Router (file-based, code-split) · TanStack Query · Axios · Zod · Tailwind CSS v4 · shadcn/ui (Radix) · react-hook-form · decimal.js · MSW 2 + `@mswjs/socket.io-binding` · socket.io-client · Vitest · Playwright + `@axe-core/playwright` · Lighthouse · ESLint (boundaries) · commitlint + husky · Vercel.

## Como rodar

Pré-requisitos: **Node 22+** e **pnpm 10** (`corepack enable`).

```bash
pnpm i
pnpm dev          # http://localhost:5173 — mocks ligados
```

Nenhum serviço externo é necessário: API REST e Socket.IO são simulados no navegador pelo MSW.

### Variáveis de ambiente

Já versionadas em [`.env`](./.env) (valores de demonstração, sem segredos). São validadas com Zod em `src/shared/config/env.ts`, e o app falha cedo se alguma estiver inválida.

| Variável            | Padrão                | Uso                                                                                       |
| ------------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true`                | Liga o backend simulado (MSW). Fica ligado no dev, nos testes e no deploy de demonstração |
| `VITE_API_BASE_URL` | `/api`                | Base da API REST (interceptada pelo MSW)                                                  |
| `VITE_REALTIME_URL` | `wss://realtime.mock` | Origem do Socket.IO (interceptada pelo binding)                                           |

## Comandos

| Comando                  | O que faz                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`               | Servidor de desenvolvimento com mocks                                                                                                             |
| `pnpm build`             | Gera rotas, typecheck (`tsc -b`) e build de produção                                                                                              |
| `pnpm preview`           | Serve o build em `http://localhost:4173`                                                                                                          |
| `pnpm typecheck`         | TypeScript strict                                                                                                                                 |
| `pnpm lint`              | ESLint (inclui fronteiras de arquitetura), zero warnings                                                                                          |
| `pnpm test`              | Testes unitários (Vitest) da camada `model/` e utilitários                                                                                        |
| `pnpm test:coverage`     | Unitários com cobertura                                                                                                                           |
| `pnpm test:e2e`          | Playwright: 12+1 specs em desktop e mobile, regressão visual em 390/768/1440 e axe                                                                |
| `pnpm test:e2e:update`   | Regenera as baselines visuais                                                                                                                     |
| `pnpm test:e2e:report`   | Abre o relatório HTML do Playwright                                                                                                               |
| `pnpm lighthouse`        | Lighthouse em início e detalhe, mobile e desktop, 3 execuções, mediana                                                                            |
| `pnpm lighthouse:assert` | Falha se a mediana ficar abaixo da meta ou regredir mais de 3 pontos sobre `lighthouse/baseline.json` (quando existir; `--update-baseline` grava) |
| `pnpm shell:update`      | Recaptura o shell estático do `index.html` (ver ADR 0005)                                                                                         |
| `pnpm check`             | Tudo em sequência: typecheck → lint → unit → build → e2e → lighthouse → assert                                                                    |

## Cenários simulados (seleção e reset)

Todos os cenários são determinísticos e usam o **mesmo** backend simulado em dev, no deploy e nos testes.

Há três formas de selecionar:

1. **URL:** `?scenario=<id>`. Acrescente `&mock-reset` para restaurar o banco simulado (catálogo, usuários, carrinhos, pedidos) ao estado inicial. Exemplo: `/?scenario=payment-rejected&mock-reset`.
2. **Painel:** botão **“Cenários”** no canto inferior esquerdo da demo. Ele lista todos os cenários e tem as ações **Aplicar e recarregar** e **Aplicar e resetar dados**. O reset também limpa sessão, carrinho de visitante e rascunhos do app.
3. **Console / testes:** `window.__kurioMocks` (`reset(id?)`, `setScenario(id)`, `updateNft(id, patch)`, `replayEvent(eventId)`, `replayAsStale(eventId)`, `disconnectSockets()`, `events()`).

A escolha persiste em `localStorage` (`kurio:mock-scenario`) e o banco em `kurio:mock-db`.

| id                  | Cenário                   | Efeito                                                               |
| ------------------- | ------------------------- | -------------------------------------------------------------------- |
| `default`           | Sucesso                   | Latência baixa; pagamento confirmado                                 |
| `empty-catalog`     | Catálogo vazio            | Nenhum NFT cadastrado                                                |
| `slow`              | Latência alta             | Respostas entre 1,5 s e 2,5 s (skeletons visíveis)                   |
| `out-of-order`      | Respostas fora de ordem   | Buscas antigas respondem depois das novas                            |
| `network-error`     | Falha de conexão          | Catálogo e detalhe sem rede                                          |
| `server-error`      | Erro 5xx                  | Catálogo, detalhe e carrinho respondem 500                           |
| `flaky`             | Instável                  | 1ª chamada de cada endpoint falha com 503; a nova tentativa funciona |
| `session-expired`   | Sessão expira             | Sessões duram 60 s                                                   |
| `forbidden`         | Acesso não autorizado     | Perfil e carteiras respondem 403                                     |
| `validation-error`  | Validação no servidor     | Cadastro e perfil respondem 422 com erros por campo                  |
| `favorites-failure` | Favoritos falham          | Inclusão/remoção respondem 500 após 1 s (rollback visível)           |
| `price-change`      | Preço muda na compra      | Ao confirmar, o preço sobe e a cotação fica obsoleta                 |
| `sold-out`          | Edição esgota na compra   | Ao confirmar, uma edição do carrinho esgota                          |
| `order-timeout`     | Timeout após criar pedido | Pedido criado, resposta passa do timeout do cliente                  |
| `payment-rejected`  | Pagamento recusado        | O pedido termina recusado                                            |
| `wallet-rejected`   | Carteira recusa conexão   | A conexão simulada da carteira é recusada                            |

Conflito de cadastro (409) não precisa de cenário: basta cadastrar `ana@kurio.dev`.

## Como reproduzir cada fluxo de falha

> Use a demo ou `pnpm dev`. Cada link já reseta os dados. Entre com `ana@kurio.dev` / `Kurio2026` quando pedido.

| Fluxo                               | Passo a passo                                                                                         | Resultado esperado                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Resultado vazio                     | `/?scenario=empty-catalog&mock-reset`                                                                 | Estado vazio com orientação, sem quebrar o layout                                                |
| Busca sem resultado                 | `/?q=zzz`                                                                                             | Estado vazio específico da busca, com ação para limpar                                           |
| Falha de conexão                    | `/?scenario=network-error&mock-reset` → **Tentar novamente**                                          | Mensagem de erro e recuperação ao trocar para `default`                                          |
| Erro 5xx                            | `/?scenario=server-error&mock-reset`                                                                  | Erro com retry no catálogo, no detalhe e no carrinho                                             |
| Instável                            | `/?scenario=flaky&mock-reset`                                                                         | 1ª falha recupera sozinha (retry só em erro transitório)                                         |
| Respostas fora de ordem             | `/?scenario=out-of-order&mock-reset` → digite rápido na busca                                         | Prevalece sempre a última busca                                                                  |
| Skeletons                           | `/?scenario=slow&mock-reset`                                                                          | Shimmer no catálogo, no detalhe e no resumo, sem layout shift                                    |
| NFT inexistente                     | `/nft/nao-existe`                                                                                     | 404 do NFT com caminho de volta                                                                  |
| Rota inexistente                    | `/qualquer-coisa`                                                                                     | Página 404                                                                                       |
| Cadastro duplicado                  | `/register` com `ana@kurio.dev`                                                                       | 409 exibido no campo e-mail                                                                      |
| Validação do servidor               | `/?scenario=validation-error&mock-reset` → `/register`                                                | Erro 422 no campo correspondente                                                                 |
| Sessão expirada                     | `/?scenario=session-expired&mock-reset` → login → aguarde 60 s → navegue ou confirme o checkout       | Redireciona ao login com aviso e volta ao ponto onde parou (o rascunho do checkout é preservado) |
| Acesso não autorizado               | `/?scenario=forbidden&mock-reset` → login → `/profile`                                                | Mensagem de permissão (403)                                                                      |
| Guard de rota                       | Sem login, abra `/checkout`                                                                           | Redireciona ao login e retorna após entrar                                                       |
| Favorito com falha                  | `/?scenario=favorites-failure&mock-reset` → login → favoritar                                         | Coração muda na hora e volta após 1 s, com aviso (rollback)                                      |
| Cupom inválido / expirado           | Carrinho → `XYZ` / `LAUNCH24`                                                                         | Mensagem específica; `KURIO10` aplica 10%                                                        |
| Preço muda na compra                | `/?scenario=price-change&mock-reset` → login → carrinho → checkout → revisar → confirmar              | Confirmação bloqueada, diferenças destacadas e nova confirmação exigida                          |
| Edição esgota                       | `/?scenario=sold-out&mock-reset` → mesmo fluxo                                                        | Item esgotado sinalizado; não deixa confirmar sem ajustar                                        |
| Timeout + idempotência              | `/?scenario=order-timeout&mock-reset` → mesmo fluxo                                                   | Reenvio com a mesma `Idempotency-Key`: **um único pedido**, recuperado após refresh              |
| Clique repetido                     | Clique várias vezes em **Confirmar**                                                                  | Um único pedido                                                                                  |
| Pagamento recusado                  | `/?scenario=payment-rejected&mock-reset` → mesmo fluxo                                                | Tela de recusa; carrinho preservado                                                              |
| Carteira recusa                     | `/?scenario=wallet-rejected&mock-reset` → checkout ou `/wallets` → conectar                           | Erro de recusa exibido; dá para tentar de novo ou escolher a outra carteira                      |
| Preço/estoque ao vivo               | Com um item no carrinho, rode no console: `__kurioMocks.updateNft('nft-001', { priceDelta: '0.25' })` | Aviso no carrinho, resumo atualizado; no checkout a cotação obsoleta bloqueia a confirmação      |
| Evento duplicado / antigo           | `__kurioMocks.replayEvent(id)` / `__kurioMocks.replayAsStale(id)` (ids em `__kurioMocks.events()`)    | Ignorados: nada regride nem é reaplicado                                                         |
| Queda do socket com pedido pendente | Confirme um pedido e rode `__kurioMocks.disconnectSockets()` (ou dê refresh)                          | Ao reconectar, o mesmo pedido é recuperado via REST, sem nova compra                             |
| Troca de usuário                    | Login como Ana → favoritar/adicionar ao carrinho → sair → login como Bruno                            | Nenhum dado da Ana no cache, no storage ou no socket                                             |

## Testes

| Camada           | Ferramenta                                   | Cobertura                                                                                                                                                                                            |
| ---------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unitários        | Vitest (`pnpm test`)                         | `model/` de cada feature: dinheiro (decimal), carrinho e merge, cotação e detecção de cotação obsoleta, reducer de eventos (dedupe + versão + usuário), search params, idempotência, sessão, pedidos |
| E2E funcional    | Playwright, Chromium **desktop e mobile**    | Os 12 cenários exigidos em `e2e/specs/01…12`, mais `13-app-shell`                                                                                                                                    |
| Regressão visual | `toHaveScreenshot` em **390, 768 e 1440 px** | Início, detalhe, carrinho e pagamento, com fixtures determinísticas, banco resetado, animações desligadas e baselines versionadas em `e2e/visual/__snapshots__`                                      |
| Acessibilidade   | `@axe-core/playwright`                       | Todas as telas, **zero violações `serious`/`critical`**                                                                                                                                              |
| Relatórios       | HTML + `trace: 'retain-on-failure'`          | Publicados como artifacts no CI                                                                                                                                                                      |

Cada teste parte de estado isolado: reset do banco simulado + cenário via `window.__kurioMocks`. Eventos de tempo real são disparados pelo servidor simulado e chegam ao app pelo `socket.io-client`, como em produção.

Specs E2E: `01-catalog` · `02-detail` · `03-auth` · `04-favorites` · `05-cart` · `06-purchase` · `07-payment-failures` · `08-account` · `09-realtime-checkout` · `10-realtime-events` · `11-accessibility` · `12-loading-states` · `13-app-shell`.

CI ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)): typecheck → lint → unit (cobertura) → build → E2E desktop + mobile + visual → Lighthouse, com relatório do Playwright, traces e relatórios do Lighthouse como artifacts. As baselines visuais são renderizadas no próprio runner do CI (workflow manual [`update-visual-baselines.yml`](./.github/workflows/update-visual-baselines.yml)), para comparar sempre o mesmo sistema de fontes.

## Lighthouse

Auditoria do **build de produção** (`vite preview`) com o cenário padrão dos mocks, em **início** e **detalhe**, nos perfis **mobile** (Moto G, 4G lento simulado, CPU 4×) e **desktop**. São **3 execuções por página e perfil**, reportando a **mediana** (`computeMedianRun` do Lighthouse). Configuração em [`lighthouse/`](./lighthouse) e relatórios HTML/JSON versionados em [`lighthouse/reports/`](./lighthouse/reports).

<!-- lighthouse:start -->

| Página  | Perfil  | Performance | Accessibility | Best Practices | SEO | LCP   | TBT    | CLS   |
| ------- | ------- | ----------- | ------------- | -------------- | --- | ----- | ------ | ----- |
| início  | mobile  | **97**      | 100           | 100            | 100 | 1,4 s | 184 ms | 0     |
| início  | desktop | **100**     | 100           | 100            | 100 | 0,4 s | 0 ms   | 0,003 |
| detalhe | mobile  | **85**      | 100           | 100            | 100 | 4,0 s | 170 ms | 0     |
| detalhe | desktop | **99**      | 100           | 100            | 100 | 0,8 s | 0 ms   | 0     |

<!-- lighthouse:end -->

Ambiente, versões e condições de cada medição: [`lighthouse/reports/summary.md`](./lighthouse/reports/summary.md).

O que foi feito para o mobile, onde as soluções de referência ficaram entre 81 e 85:

- **Shell estático no `index.html`** (header, hero e skeletons) capturado do próprio app. O primeiro paint e o LCP do início acontecem antes de qualquer JS, da API e do MSW ([ADR 0005](./docs/adr/0005-static-app-shell.md)).
- **Boot depois do primeiro paint, em tarefas curtas:** o bundle é importado só depois que o shell (e a arte do hero) pintou. Env, contratos, React e app são avaliados em tarefas separadas, com _yield_ entre elas. O router resolve a rota antes do primeiro render, e esse render roda em `startTransition`, fatiado.
- **Conteúdo abaixo da dobra adiado** (rodapé e seções editoriais) para o primeiro commit ficar pequeno.
- **MSW sem bloquear o render:** o worker sobe em paralelo e as requisições esperam por um _gate_ ([ADR 0003](./docs/adr/0003-non-blocking-mock-boot.md)). `socket.io-client` e o painel de cenários entram por `import()` depois.
- **Backend simulado enxuto:** o `tldts` (Public Suffix List, puxada pelo MSW via `tough-cookie`) foi trocado por uma versão mínima, já que os mocks não usam cookies. O chunk dos mocks caiu de ~148 KB para ~36 KB gzip.
- **Imagens:** AVIF/WebP responsivos (`srcset` + `sizes`), `width`/`height` explícitos, `aspect-ratio`, `fetchpriority="high"` só na imagem LCP e `lazy` abaixo da dobra.
- **Fonte:** Roboto Mono self-hosted, WOFF2 com subset latin, `font-display: swap` e preload.
- **Code-split por rota** (`autoCodeSplitting`) e cache imutável dos assets (`vercel.json`).

**Abaixo da meta: performance do detalhe mobile.** O maior elemento da tela é a arte do NFT, e a URL dela vem da API. Neste projeto a API é o MSW rodando no próprio navegador, então o LCP inclui baixar, avaliar e registrar o backend simulado antes da resposta, tudo sob CPU 4× e 4G lento. Em produção, com API real e CDN de imagens, esse custo não existe no cliente. A justificativa e a alternativa avaliada estão em [`ARCHITECTURE.md`](./ARCHITECTURE.md#performance). A exceção está registrada em `lighthouse/config.mjs` (`WAIVERS`): a meta não é cobrada ali, mas a regressão continua sendo.

## Arquitetura em 1 minuto

```
src/
  app/        bootstrap: providers, QueryClient, router, layout, shell estático
  routes/     TanStack Router file-based — finas (validateSearch, loader, guard, composição)
  features/   auth · catalog · nft-detail · favorites · cart · quote · checkout · orders · profile · wallets · realtime
              cada uma com model/ (puro, testado) · api/ · queries/ · ui/ · index.ts (API pública)
  shared/     contracts (Zod, fonte única) · http (Axios + AppError) · money (decimal) · ui (shadcn) · config · lib
  mocks/      backend simulado: db único + seeds, handlers por feature, socket, cenários, painel
e2e/          fixtures, specs 01–13, regressão visual
lighthouse/   configuração, script de 3 execuções + mediana, assert, relatórios
docs/adr/     decisões registradas
```

- Dependência em sentido único: `app → routes → features → shared`. Deep imports entre features e qualquer import de `mocks/` pelo app **quebram o lint**. `model/` não pode importar React, Axios nem Query.
- **Contratos Zod únicos** em `src/shared/contracts`, usados pelos handlers MSW, pelo cliente Axios, pelos hooks e pela UI.
- **Dinheiro** trafega como string decimal e é calculado com `decimal.js`; quantidades são inteiras ([ADR 0002](./docs/adr/0002-money-as-decimal-strings.md)).
- **Query keys em factory por feature**; toda key privada inclui o dono (`userId` ou visitante). Logout ou troca de usuário limpa o cache privado e troca o socket.

Detalhes em [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Acessibilidade

- Navegação completa por teclado, foco visível e _skip link_.
- Foco preso em dialogs e drawers, e devolvido ao fechar.
- Labels e erros associados aos campos (`aria-describedby`, `role="alert"`).
- `aria-live` para mutations (carrinho, favoritos, cupom) e eventos em tempo real.
- Estados nunca dependem só de cor (ícones e texto).
- Skeletons respeitam `prefers-reduced-motion`.
- axe-core em todas as telas no E2E, com zero violações sérias ou críticas.

## Deploy

Vercel com deploy automático a cada push na `main`, a partir do último commit: https://jungle-nft-marketplace-three.vercel.app

- Rewrite de SPA: todas as rotas servem `index.html`, então acesso direto e refresh funcionam em `/nft/<id>`, `/cart`, `/checkout`, `/orders/<id>`, `/profile`, `/wallets` e na 404.
- `mockServiceWorker.js` em `public/`, e mocks ligados no build de demonstração.
- Headers de segurança (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS) e cache imutável para `assets/` e `fonts/`.

## Limitações conhecidas

- **Backend simulado:** dados e sessão vivem no navegador (`localStorage`), por definição do desafio. Cada navegador tem seu próprio “servidor”.
- **Login social / WalletConnect, recuperação de senha, páginas editoriais e “Ver no Etherscan”** aparecem por fidelidade ao Figma, mas ficam desabilitados e dizem isso. Nenhum finge sucesso.
- **Telas mobile** não existem no Figma (só desktop). Foram desenhadas no mesmo sistema visual; os desvios estão em [`ARCHITECTURE.md`](./ARCHITECTURE.md#desvios-do-figma).
- **Detalhe mobile no Lighthouse** fica em 85, abaixo de 90, pelo motivo explicado [acima](#lighthouse).
- O binding do Socket.IO só suporta transporte WebSocket e não envia ping, então o servidor simulado envia heartbeat (ver [`ARCHITECTURE.md`](./ARCHITECTURE.md#socketio-via-msw-transporte-e-limitações-do-binding)).
