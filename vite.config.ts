import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  // Lazily imported at runtime; pre-bundle them so dev never serves an outdated dep.
  optimizeDeps: { include: ['socket.io-client', 'msw/browser', '@mswjs/socket.io-binding'] },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
})
