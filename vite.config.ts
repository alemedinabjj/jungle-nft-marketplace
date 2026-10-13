import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { SHELL_ROUTE_GUARD } from './scripts/shell-utils.mjs'

/**
 * App shell: inline the pre-captured static markup (header + hero + skeletons)
 * into #root so first paint and the hero LCP never wait for JS, the API or MSW.
 * React replaces it on its first commit. See docs/adr/0005-static-app-shell.md.
 */
function appShell(): Plugin {
  const file = fileURLToPath(new URL('./src/app/shell/home-shell.html', import.meta.url))
  return {
    name: 'kurio-app-shell',
    transformIndexHtml(html) {
      if (!existsSync(file)) return html
      const shell = readFileSync(file, 'utf8').trim()
      return html.replace('<div id="root"></div>', `<div id="root">${shell}</div>${SHELL_ROUTE_GUARD}`)
    },
  }
}

/**
 * Boot the app only after the shell has painted — including the hero artwork when
 * the shell has one — so first paint and LCP never wait for JS parse/eval. Chunks
 * still download in parallel through the <link rel="modulepreload"> hints.
 * A timeout fallback covers background tabs (no rAF) and slow images.
 */
const BOOT_SCRIPT = [
  'let s=0;const go=()=>{if(!s){s=1;import(__ENTRY__)}};',
  'const i=document.querySelector("#root img");',
  'const ready=i&&!i.complete?new Promise(r=>{i.addEventListener("load",r);i.addEventListener("error",r)}):Promise.resolve();',
  'ready.then(()=>requestAnimationFrame(()=>requestAnimationFrame(go)));',
  'setTimeout(go,1500)',
].join('')

function bootAfterFirstPaint(): Plugin {
  return {
    name: 'kurio-boot-after-paint',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<script type="module" crossorigin src="([^"]+)"><\/script>/,
          (_match, src: string) =>
            `<script type="module">${BOOT_SCRIPT.replace('__ENTRY__', JSON.stringify(src))}</script>`,
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [
    // Must come before the React plugin so generated routes are transformed.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
    appShell(),
    bootAfterFirstPaint(),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // Mock-only dependency diet: see src/mocks/vendor/tldts-lite.ts
      {
        find: /^tldts$/,
        replacement: fileURLToPath(new URL('./src/mocks/vendor/tldts-lite.ts', import.meta.url)),
      },
    ],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    // No <link rel="modulepreload"> in index.html: the shell paints first and the
    // deferred boot pulls the entry graph; preloads for lazy routes are kept.
    modulePreload: {
      resolveDependencies: (_filename, deps, { hostType }) => (hostType === 'html' ? [] : deps),
    },
  },
  // Lazily imported at runtime; pre-bundle them so dev never serves an outdated dep.
  optimizeDeps: { include: ['socket.io-client', 'msw/browser', '@mswjs/socket.io-binding'] },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
})
