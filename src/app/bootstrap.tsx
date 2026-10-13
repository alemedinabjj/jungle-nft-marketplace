import { StrictMode, startTransition } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers/app-providers'
import { createQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'

/**
 * Mounts the app over the static shell. The code-split chunks of the initial
 * route are loaded *before* the first render, so React renders the real screen
 * once, in a transition (time-sliced), instead of suspending and re-rendering
 * synchronously on router updates. Data gets a short budget only: past it,
 * loaders keep running inside the router, with pending UI (skeletons) as usual.
 */
const INITIAL_LOAD_BUDGET_MS = 400

export async function startApp(rootElement: HTMLElement): Promise<void> {
  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient)
  const [matchedRoutes] = router.getMatchedRoutes(router.state.location.pathname)
  await Promise.all(matchedRoutes.map((route) => router.loadRouteChunk(route) ?? Promise.resolve()))
  // Give a fast initial load (loaders, guards) a brief head start so the first
  // render is usually final; slow ones fall back to the routes' pending UI.
  await Promise.race([router.load(), new Promise((resolve) => setTimeout(resolve, INITIAL_LOAD_BUDGET_MS))])
  startTransition(() => {
    createRoot(rootElement).render(
      <StrictMode>
        <AppProviders queryClient={queryClient} router={router} />
      </StrictMode>,
    )
  })
}
