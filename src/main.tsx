import { StrictMode } from 'react'
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
  setRequestGate(import('@/mocks/browser').then(({ startMockWorker }) => startMockWorker()))
}

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders queryClient={queryClient} router={router} />
  </StrictMode>,
)
