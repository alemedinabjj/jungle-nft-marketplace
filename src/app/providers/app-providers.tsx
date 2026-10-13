import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { useEffect } from 'react'
import type { createAppRouter } from '@/app/router'
import { LiveRegionProvider } from '@/shared/ui/live-region'

interface AppProvidersProps {
  queryClient: QueryClient
  router: ReturnType<typeof createAppRouter>
}

/**
 * Marks the document once React has replaced the static shell (first commit).
 * Until then the shell's controls are inert; tests and the shell capture wait on it.
 */
function AppReady() {
  useEffect(() => {
    document.documentElement.dataset.appReady = 'true'
  }, [])
  return null
}

export function AppProviders({ queryClient, router }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveRegionProvider>
        <RouterProvider router={router} />
        <AppReady />
      </LiveRegionProvider>
    </QueryClientProvider>
  )
}
