import { QueryClient } from '@tanstack/react-query'
import { isAppError } from '@/shared/http'

/**
 * Cache policy (see ARCHITECTURE.md → "Estratégia de cache"):
 * - public catalog data: short staleTime, kept fresh by realtime events
 * - retries only for transient failures (5xx/timeout/network), never for 4xx
 * - mutations never retry automatically (non-idempotent by default)
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => isAppError(error) && error.isRetryable && failureCount < 2,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
      },
      mutations: { retry: false },
    },
  })
}
