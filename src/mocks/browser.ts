import { setupWorker } from 'msw/browser'
import { bootstrapMocks, mockControl, type MockControl } from './control'
import { handlers } from './handlers'

declare global {
  interface Window {
    __kurioMocks?: MockControl
  }
}

export const worker = setupWorker(...handlers)

export async function startMockWorker(): Promise<void> {
  await worker.start({
    onUnhandledRequest(request, print) {
      const url = new URL(request.url)
      // Static assets, fonts and Vite internals are expected to bypass the mocks.
      if (url.origin === location.origin && !url.pathname.startsWith('/api')) return
      print.warning()
    },
    quiet: true,
  })
  await bootstrapMocks(new URL(location.href))
  window.__kurioMocks = mockControl
}
