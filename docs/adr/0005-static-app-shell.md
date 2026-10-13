# 0005 — Shell estático no index.html e boot após o primeiro paint

**Status:** aceita

## Contexto

Numa SPA, o primeiro paint espera baixar e executar o bundle. No perfil mobile do Lighthouse (4G lento, CPU 4×), isso levava o FCP a ~3,7 s e o LCP do início a ~5 s, porque a maior imagem visível (os cards do catálogo) dependia da API, ou seja, do MSW.

## Decisão

- `scripts/capture-shell.mjs` abre o build de produção com o chunk do MSW retido (então nenhum dado entra) e captura o markup do primeiro render: header, busca mobile, hero estático e skeletons.
- O plugin `appShell` do Vite injeta esse markup dentro de `#root` no `index.html`. Um script inline e síncrono remove o conteúdo do `<main>` em rotas que não são `/`.
- O plugin `bootAfterFirstPaint` troca o `<script type="module">` de entrada por um import feito depois que o shell (e a arte do hero) pintou, e remove os `modulepreload` do HTML.
- O `main.tsx` avalia o grafo em tarefas separadas (env → contratos → React → app), com _yield_ entre elas. O `bootstrap` faz `router.load()` antes de renderizar, e o React substitui o shell no primeiro commit (`createRoot`), com o render inicial em `startTransition` para ser fatiado. Resolver a rota antes evita que atualizações do store do router (via `useSyncExternalStore`) forcem um re-render síncrono no meio do render concorrente.
- No mobile, a arte do hero passou a ser uma faixa larga acima do texto, o maior elemento da dobra e 100% estático.
- O E2E `13-app-shell` falha se o shell versionado divergir do render real. Para regenerar: `pnpm build && pnpm shell:update`.

## Consequências

- FCP e LCP do início não dependem de JS, API ou MSW.
- Mudanças no header ou no hero exigem regenerar o shell; o teste de drift avisa.
- Links do shell são `<a href>` reais: um clique antes do boot faz navegação completa, e nada quebra.
