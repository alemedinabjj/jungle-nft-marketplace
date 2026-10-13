import { StrictMode, startTransition } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers/app-providers'
import { createQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'
import { env } from '@/shared/config/env'
import { setRequestGate } from '@/shared/http'
import './index.css'

/**
 * Boot order (performance-critical, see docs/adr/0003-non-blocking-mock-boot.md):
 * 1. kick off the mock worker without awaiting it;
 * 2. gate outgoing requests on that promise;
 * 3. render the shell immediately so the LCP never waits on MSW.
 */
if (env.VITE_ENABLE_MOCKS) {
  const ready = import('@/mocks/browser').then(({ startMockWorker }) => startMockWorker())
  setRequestGate(ready)
  // Scenario panel: lazy, after the worker is up. Hidden under browser automation
  // (Playwright/visual baselines drive scenarios through the URL and window.__kurioMocks).
  if (!navigator.webdriver) {
    void ready.then(async () => {
      const [{ mountScenarioPanel }, { mockControl }] = await Promise.all([
        import('@/mocks/panel/mount'),
        import('@/mocks/control'),
      ])
      mountScenarioPanel(mockControl)
    })
  }
}

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

// The static shell is already on screen, so the first render can be a transition:
// React time-slices it instead of blocking the main thread in one long task.
startTransition(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders queryClient={queryClient} router={router} />
    </StrictMode>,
  )
})
