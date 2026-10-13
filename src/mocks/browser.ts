import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

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
}
