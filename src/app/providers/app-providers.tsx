import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import type { createAppRouter } from '@/app/router'
import { LiveRegionProvider } from '@/shared/ui/live-region'

interface AppProvidersProps {
  queryClient: QueryClient
  router: ReturnType<typeof createAppRouter>
}

export function AppProviders({ queryClient, router }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveRegionProvider>
        <RouterProvider router={router} />
      </LiveRegionProvider>
    </QueryClientProvider>
  )
}
