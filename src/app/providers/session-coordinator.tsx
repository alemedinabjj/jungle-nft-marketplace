import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { currentToken, endSession } from '@/features/auth'
import { onUnauthorized, setTokenProvider } from '@/shared/http'
import { useAnnounce } from '@/shared/ui/live-region'

// The HTTP client reads the token fresh on every request.
setTokenProvider(currentToken)

const EXPIRED_CODES = new Set(['SESSION_EXPIRED', 'UNAUTHENTICATED'])

/**
 * Global reaction to an expired/invalid session (from any request): wipe all
 * cached user data and send the user to login, remembering where they were
 * (the checkout keeps its draft separately so it can be resumed).
 */
export function SessionCoordinator() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const announce = useAnnounce()

  useEffect(
    () =>
      onUnauthorized((error) => {
        if (!error.code || !EXPIRED_CODES.has(error.code) || !currentToken()) return
        endSession(queryClient)
        announce('Sua sessão expirou. Entre novamente para continuar.', 'assertive')
        const { pathname, searchStr } = router.state.location
        if (pathname === '/login') return
        void router.navigate({
          to: '/login',
          search: { redirect: `${pathname}${searchStr}`, reason: 'expired' },
        })
      }),
    [queryClient, router, announce],
  )
  return null
}
