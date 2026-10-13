import { setRequestGate } from '@/shared/http/request-gate'
import './index.css'

/**
 * Boot order (performance-critical — docs/adr/0003 and 0005):
 * 1. the static shell is already painted (index.html) when this runs;
 * 2. the mock worker starts without being awaited and gates outgoing requests;
 * 3. the app graph is evaluated in a few separate tasks (yielding in between),
 *    so no single long task blocks the main thread, then React takes over the shell.
 */
const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true'
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

if (mocksEnabled) {
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

async function boot(): Promise<void> {
  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('Root element #root not found')
  // Typed env + contracts (Zod schemas) first, in their own task: fails fast on bad config.
  await import('@/shared/config/env')
  await yieldToMain()
  await import('@/shared/contracts')
  await yieldToMain()
  await import('react-dom/client')
  await yieldToMain()
  const { startApp } = await import('@/app/bootstrap')
  await yieldToMain()
  await startApp(rootElement)
}

void boot()
